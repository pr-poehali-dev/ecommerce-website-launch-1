import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  { id: 1, name: 'Смартфон Galaxy X', price: 45990, oldPrice: 59990, discount: 23, image: '📱', category: 'electronics' },
  { id: 2, name: 'Наушники Pro Max', price: 12990, oldPrice: 16990, discount: 23, image: '🎧', category: 'electronics' },
  { id: 3, name: 'Умные часы Sport', price: 8990, oldPrice: 12990, discount: 31, image: '⌚', category: 'electronics' },
  { id: 4, name: 'Ноутбук UltraBook', price: 89990, oldPrice: 109990, discount: 18, image: '💻', category: 'electronics' },
  { id: 5, name: 'Планшет Tab Pro', price: 34990, oldPrice: 44990, discount: 22, image: '📲', category: 'electronics' },
  { id: 6, name: 'Камера Zoom 4K', price: 24990, oldPrice: 32990, discount: 24, image: '📷', category: 'electronics' },
];

const promoCodes = [
  { code: 'SAVE10', discount: 10, description: 'Скидка 10% на всё' },
  { code: 'FIRST15', discount: 15, description: 'Скидка 15% на первый заказ' },
  { code: 'MEGA20', discount: 20, description: 'Скидка 20% при заказе от 50000₽' },
];

export default function Index() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<number>(0);
  const [activeSection, setActiveSection] = useState('home');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const applyPromoCode = () => {
    const promo = promoCodes.find(p => p.code === promoCode.toUpperCase());
    if (promo) {
      setAppliedPromo(promo.discount);
    } else {
      alert('Промокод не найден');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const promoDiscount = (subtotal * appliedPromo) / 100;
  const total = subtotal - promoDiscount;

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const orderDescription = `Заказ: ${cart.map(item => `${item.name} x${item.quantity}`).join(', ')}`;
      const currentUrl = window.location.origin;
      
      const response = await fetch('https://functions.poehali.dev/e9a21470-802a-415b-b446-8393e96304ef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          description: orderDescription,
          return_url: `${currentUrl}?payment=success`
        })
      });

      const data = await response.json();

      if (response.ok && data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        alert(data.error || 'Ошибка при создании платежа');
      }
    } catch (error) {
      alert('Ошибка соединения с сервером оплаты');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-12">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">🔥 Горячие предложения</Badge>
          <h1 className="text-5xl font-bold mb-4">Мега-распродажа электроники!</h1>
          <p className="text-xl mb-6 text-white/90">Скидки до 50% на смартфоны, ноутбуки и аксессуары</p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => setActiveSection('catalog')}>
              <Icon name="ShoppingBag" className="mr-2" />
              В каталог
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Узнать больше
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 text-[200px] opacity-10">🎁</div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">⚡ Хиты продаж</h2>
          <Button variant="ghost" onClick={() => setActiveSection('catalog')}>
            Смотреть всё <Icon name="ArrowRight" className="ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map(product => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="relative mb-4">
                  <div className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.image}</div>
                  {product.discount && (
                    <Badge className="absolute top-0 right-0 bg-accent text-white font-bold">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()}₽</span>
                  {product.oldPrice && (
                    <span className="text-muted-foreground line-through">{product.oldPrice.toLocaleString()}₽</span>
                  )}
                </div>
                <Button onClick={() => addToCart(product)} className="w-full font-semibold">
                  <Icon name="ShoppingCart" className="mr-2" />
                  В корзину
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">🎫 Актуальные промокоды</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promoCodes.map(promo => (
            <Card key={promo.code} className="border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{promo.code}</div>
                <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                <Badge className="bg-secondary text-white">-{promo.discount}%</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );

  const renderCatalog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">📦 Каталог товаров</h2>
        <Badge className="text-lg py-1 px-3">{products.length} товаров</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/50 animate-fade-in">
            <CardContent className="p-6">
              <div className="relative mb-4">
                <div className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.image}</div>
                {product.discount && (
                  <Badge className="absolute top-0 right-0 bg-accent text-white font-bold text-base">
                    -{product.discount}%
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()}₽</span>
                {product.oldPrice && (
                  <span className="text-muted-foreground line-through">{product.oldPrice.toLocaleString()}₽</span>
                )}
              </div>
              <Button onClick={() => addToCart(product)} className="w-full font-semibold">
                <Icon name="ShoppingCart" className="mr-2" />
                В корзину
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold mb-6">🏪 О магазине</h2>
      <Card>
        <CardContent className="p-8 space-y-4">
          <p className="text-lg">Добро пожаловать в наш интернет-магазин электроники! Мы предлагаем широкий ассортимент качественных товаров по выгодным ценам.</p>
          <p className="text-lg">Наши преимущества:</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="Check" className="text-primary mt-1 flex-shrink-0" />
              <span>Официальная гарантия на все товары</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="Check" className="text-primary mt-1 flex-shrink-0" />
              <span>Быстрая доставка по всей России</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="Check" className="text-primary mt-1 flex-shrink-0" />
              <span>Система скидок и промокодов</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="Check" className="text-primary mt-1 flex-shrink-0" />
              <span>Профессиональная консультация</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderDelivery = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold mb-6">🚚 Доставка и оплата</h2>
      <Card>
        <CardContent className="p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Icon name="Truck" className="text-primary" />
              Способы доставки
            </h3>
            <ul className="space-y-2 ml-8">
              <li>• Курьерская доставка по Москве — 300₽ (бесплатно от 5000₽)</li>
              <li>• Доставка в регионы — от 500₽</li>
              <li>• Самовывоз из пункта выдачи — бесплатно</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Icon name="CreditCard" className="text-primary" />
              Способы оплаты
            </h3>
            <ul className="space-y-2 ml-8">
              <li>• Банковской картой онлайн</li>
              <li>• Наличными курьеру</li>
              <li>• Банковским переводом</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContacts = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold mb-6">📞 Контакты</h2>
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <Icon name="Phone" className="text-primary mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Телефон</h3>
              <p className="text-lg">+7 (495) 123-45-67</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Icon name="Mail" className="text-primary mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-lg">info@shop.ru</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Icon name="MapPin" className="text-primary mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Адрес</h3>
              <p className="text-lg">г. Москва, ул. Примерная, д. 123</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Icon name="Clock" className="text-primary mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold mb-1">Часы работы</h3>
              <p className="text-lg">Пн-Пт: 9:00 - 21:00</p>
              <p className="text-lg">Сб-Вс: 10:00 - 20:00</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection('home')}>
              <div className="text-3xl">🛍️</div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShopMega
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" onClick={() => setActiveSection('home')} className="font-medium">
                Главная
              </Button>
              <Button variant="ghost" onClick={() => setActiveSection('catalog')} className="font-medium">
                Каталог
              </Button>
              <Button variant="ghost" onClick={() => setActiveSection('about')} className="font-medium">
                О магазине
              </Button>
              <Button variant="ghost" onClick={() => setActiveSection('delivery')} className="font-medium">
                Доставка
              </Button>
              <Button variant="ghost" onClick={() => setActiveSection('contacts')} className="font-medium">
                Контакты
              </Button>
            </nav>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="relative font-semibold">
                  <Icon name="ShoppingCart" className="mr-2" />
                  Корзина
                  {cart.length > 0 && (
                    <Badge className="ml-2 bg-secondary text-white">{cart.length}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-2xl">🛒 Корзина</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-6xl mb-4">🛒</div>
                      <p>Корзина пуста</p>
                    </div>
                  ) : (
                    <>
                      {cart.map(item => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="text-4xl">{item.image}</div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{item.name}</h4>
                                <p className="text-primary font-bold">{item.price.toLocaleString()}₽</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeFromCart(item.id)}
                                    className="ml-auto"
                                  >
                                    <Icon name="Trash2" size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Введите промокод"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <Button onClick={applyPromoCode}>
                              Применить
                            </Button>
                          </div>
                          {appliedPromo > 0 && (
                            <div className="bg-green-100 text-green-800 p-2 rounded-lg text-sm font-medium">
                              ✓ Промокод применён: -{appliedPromo}%
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between">
                            <span>Сумма:</span>
                            <span className="font-semibold">{subtotal.toLocaleString()}₽</span>
                          </div>
                          {appliedPromo > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Скидка:</span>
                              <span className="font-semibold">-{promoDiscount.toLocaleString()}₽</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl font-bold pt-2 border-t">
                            <span>Итого:</span>
                            <span className="text-primary">{total.toLocaleString()}₽</span>
                          </div>
                          <Button 
                            className="w-full mt-4 font-semibold" 
                            size="lg"
                            onClick={handlePayment}
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Icon name="Loader2" className="mr-2 animate-spin" />
                                Подготовка оплаты...
                              </>
                            ) : (
                              <>
                                <Icon name="CreditCard" className="mr-2" />
                                Перейти к оплате
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {activeSection === 'home' && renderHome()}
        {activeSection === 'catalog' && renderCatalog()}
        {activeSection === 'about' && renderAbout()}
        {activeSection === 'delivery' && renderDelivery()}
        {activeSection === 'contacts' && renderContacts()}
      </main>

      <footer className="bg-foreground text-background py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-3xl">🛍️</div>
                <span className="text-2xl font-bold">ShopMega</span>
              </div>
              <p className="text-background/70">Ваш надёжный магазин электроники с выгодными ценами и быстрой доставкой.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Разделы</h3>
              <ul className="space-y-2 text-background/70">
                <li className="cursor-pointer hover:text-background" onClick={() => setActiveSection('catalog')}>Каталог</li>
                <li className="cursor-pointer hover:text-background" onClick={() => setActiveSection('about')}>О магазине</li>
                <li className="cursor-pointer hover:text-background" onClick={() => setActiveSection('delivery')}>Доставка</li>
                <li className="cursor-pointer hover:text-background" onClick={() => setActiveSection('contacts')}>Контакты</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Контакты</h3>
              <ul className="space-y-2 text-background/70">
                <li>+7 (495) 123-45-67</li>
                <li>info@shop.ru</li>
                <li>г. Москва, ул. Примерная, д. 123</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/60">
            © 2024 ShopMega. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}