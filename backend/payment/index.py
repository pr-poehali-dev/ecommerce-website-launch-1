import json
import os
import uuid
import base64
from typing import Dict, Any
from pydantic import BaseModel, Field
from urllib.request import Request, urlopen
from urllib.error import HTTPError

class PaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1)
    return_url: str = Field(...)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Создание платежа через Юкассу
    Args: event - запрос с суммой и описанием заказа
          context - контекст выполнения функции
    Returns: HTTP ответ с URL для оплаты
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    
    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Ключи Юкассы не настроены',
                'details': 'Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в секреты проекта'
            }),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    payment_req = PaymentRequest(**body_data)
    
    idempotence_key = str(uuid.uuid4())
    
    payment_data = {
        'amount': {
            'value': f'{payment_req.amount:.2f}',
            'currency': 'RUB'
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': payment_req.return_url
        },
        'capture': True,
        'description': payment_req.description
    }
    
    credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()
    
    headers = {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotence_key,
        'Authorization': f'Basic {credentials}'
    }
    
    req = Request(
        'https://api.yookassa.ru/v3/payments',
        data=json.dumps(payment_data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'payment_id': result['id'],
                    'confirmation_url': result['confirmation']['confirmation_url'],
                    'status': result['status']
                }),
                'isBase64Encoded': False
            }
    except HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Ошибка создания платежа',
                'details': error_body
            }),
            'isBase64Encoded': False
        }
