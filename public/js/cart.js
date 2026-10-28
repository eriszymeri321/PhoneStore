(() => {
  const KEY = 'phone-store-cart';
  const COOKIE_KEY = 'phone_store_cart=';
  const readCart = () => {
    let localCart = null;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) localCart = JSON.parse(saved);
    } catch { /* Use the cookie fallback when browser storage is unavailable. */ }
    try {
      const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(COOKIE_KEY));
      const cookieCart = cookie ? JSON.parse(decodeURIComponent(cookie.slice(COOKIE_KEY.length))) : [];
      return localCart && localCart.length ? localCart : cookieCart;
    } catch { return localCart || []; }
  };
  const saveCart = (cart) => {
    const value = JSON.stringify(cart);
    try { localStorage.setItem(KEY, value); } catch { /* Cookie below is the fallback. */ }
    document.cookie = `${COOKIE_KEY}${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
  };

  function refresh() {
    const cart = readCart();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    });
    const container = document.querySelector('[data-cart-items]');
    if (!container) return;
    container.replaceChildren();
    if (!cart.length) {
      const message = document.createElement('p');
      message.textContent = 'Shporta është bosh.';
      container.append(message);
    }
    cart.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'cart-item';
      const info = document.createElement('div');
      const name = document.createElement('h2');
      name.textContent = item.name;
      const details = document.createElement('p');
      details.textContent = `${item.capacity} • ${item.color} • ${Number(item.price).toFixed(2)} EUR`;
      info.append(name, details);
      const quantity = document.createElement('span');
      quantity.textContent = `Sasia: ${item.quantity}`;
      const remove = document.createElement('button');
      remove.className = 'btn btn-delete';
      remove.textContent = 'Hiqe';
      remove.addEventListener('click', () => {
        saveCart(readCart().filter((entry) => entry.id !== item.id));
        refresh();
      });
      row.append(info, quantity, remove);
      container.append(row);
    });
    const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const totalElement = document.querySelector('[data-cart-total]');
    if (totalElement) totalElement.textContent = `${total.toFixed(2)} EUR`;
  }

  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      const cart = readCart();
      const id = button.dataset.id;
      const existing = cart.find((item) => item.id === id);
      if (existing) existing.quantity += 1;
      else cart.push({
        id, name: button.dataset.name, price: button.dataset.price,
        capacity: button.dataset.capacity, color: button.dataset.color,
        image: button.dataset.image, quantity: 1,
      });
      saveCart(cart);
      refresh();
      const original = button.textContent;
      button.textContent = 'U shtua në shportë';
      setTimeout(() => { button.textContent = original; }, 1200);
    });
  });

  const checkoutButton = document.querySelector('[data-checkout]');
  if (checkoutButton) {
    const dialog = document.querySelector('[data-checkout-dialog]');
    const form = document.querySelector('[data-checkout-form]');
    const errorElement = document.querySelector('[data-checkout-error]');
    const submitButton = document.querySelector('[data-checkout-submit]');
    document.querySelector('[data-checkout-cancel]').addEventListener('click', () => dialog.close());

    checkoutButton.addEventListener('click', async () => {
      const message = document.querySelector('[data-checkout-message]');
      if (!readCart().length) {
        message.textContent = 'Shto të paktën një telefon në shportë.';
        return;
      }
      errorElement.textContent = '';
      dialog.showModal();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.querySelector('[data-checkout-message]');
      const cart = readCart();
      submitButton.disabled = true;
      submitButton.textContent = 'Duke porositur...';
      errorElement.textContent = '';
      try {
        const customer = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...customer,
            items: cart.map(({ id, quantity }) => ({ id, quantity })),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Porosia nuk u ruajt.');
        saveCart([]);
        refresh();
        form.reset();
        dialog.close();
        message.textContent = `Porosia #${result.orderId} u ruajt me sukses në databazë.`;
      } catch (error) {
        errorElement.textContent = error.message;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Porosit';
      }
    });
  }
  refresh();
})();
