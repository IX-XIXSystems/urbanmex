/**
 * Store & Data Management - Catálogo URBAN MEX
 * Conectado a Firebase Realtime Database + Caché Instantánea
 */

const firebaseConfig = {
  apiKey: "AIzaSyBMgZ-4QTGUfthjyvdwy8HGf9bXV2Kb1uk",
  authDomain: "urbanmex.firebaseapp.com",
  databaseURL: "https://urbanmex-default-rtdb.firebaseio.com",
  projectId: "urbanmex",
  storageBucket: "urbanmex.firebasestorage.app",
  messagingSenderId: "960274209417",
  appId: "1:960274209417:web:faff9ae40b7614d0de0458"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = typeof firebase !== 'undefined' ? firebase.database() : null;

const STORAGE_KEYS = {
  SETTINGS: 'catalogomata_settings_v6',
  BRANDS: 'catalogomata_brands_v6',
  PRODUCTS: 'catalogomata_products_v6',
  AUTH: 'catalogomata_admin_session_v6'
};

const INITIAL_SETTINGS = {
  storeName: 'URBAN MEX',
  tagline: 'Te lo hacen realidad!',
  logoUrl: 'assets/logo.png',
  whatsapp: '51900000000',
  currency: 'S/ ',
  adminPin: '1234'
};

const INITIAL_BRANDS = [
  'Adidas',
  'Nike',
  'Supreme',
  'Jordan'
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Camisa 1',
    brand: 'Personalizada',
    category: 'custom',
    price: 0.00,
    description: 'Tallas: S, M, L, XL, XXL • Algodón 240g heavy drop.',
    image: '',
    createdAt: Date.now() - 700000
  },
  {
    id: 'prod_2',
    name: 'Camisa 2',
    brand: 'Adidas',
    category: 'brand',
    price: 0.00,
    description: 'Tallas: S, M, L, XL • 100% Algodón peinado negro • Ajuste regular fit.',
    image: '',
    createdAt: Date.now() - 600000
  },
  {
    id: 'prod_3',
    name: 'Camisa 3',
    brand: 'Nike',
    category: 'brand',
    price: 0.00,
    description: 'Tallas: S, M, L, XL • Algodón Dri-FIT 220 GSM.',
    image: '',
    createdAt: Date.now() - 500000
  },
  {
    id: 'prod_4',
    name: 'Camisa 4',
    brand: 'Adidas',
    category: 'brand',
    price: 0.00,
    description: 'Tallas: M, L, XL • Microfibra deportiva ultra ligera.',
    image: '',
    createdAt: Date.now() - 400000
  },
  {
    id: 'prod_5',
    name: 'Camisa 5',
    brand: 'Nike',
    category: 'brand',
    price: 0.00,
    description: 'Tallas: S, M, L, XL, XXL • Algodón estructurado 240 GSM.',
    image: '',
    createdAt: Date.now() - 300000
  },
  {
    id: 'prod_6',
    name: 'Camisa 6',
    brand: 'Personalizada',
    category: 'custom',
    price: 0.00,
    description: 'Tallas: M, L, XL • Personalizable con tu diseño a pedido.',
    image: '',
    createdAt: Date.now() - 200000
  },
  {
    id: 'prod_7',
    name: 'Camisa 7',
    brand: 'Personalizada',
    category: 'custom',
    price: 0.00,
    description: 'Tallas: S, M, L, XL • 100% algodón peinado negro 240g.',
    image: '',
    createdAt: Date.now() - 100000
  }
];

let _cloudReady = false;

const Store = {
  initCloudSync() {
    if (!db) return;

    // 1. Escuchar Configuración en tiempo real
    db.ref('urbanmex/settings').on('value', (snap) => {
      const val = snap.val();
      if (val) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...INITIAL_SETTINGS, ...val }));
        this._triggerUIUpdate();
      } else {
        db.ref('urbanmex/settings').set(INITIAL_SETTINGS);
      }
    });

    // 2. Escuchar Marcas en tiempo real
    db.ref('urbanmex/brands').on('value', (snap) => {
      const val = snap.val();
      if (val && Array.isArray(val)) {
        localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(val));
        this._triggerUIUpdate();
      } else {
        db.ref('urbanmex/brands').set(INITIAL_BRANDS);
      }
    });

    // 3. Escuchar Productos en tiempo real
    db.ref('urbanmex/products').on('value', (snap) => {
      const val = snap.val();
      if (val !== null) {
        const list = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
        this._triggerUIUpdate();
      } else if (!_cloudReady) {
        db.ref('urbanmex/products').set(INITIAL_PRODUCTS);
      }
      _cloudReady = true;
    });
  },

  _triggerUIUpdate() {
    window.dispatchEvent(new Event('storage'));
    if (typeof window.renderCatalog === 'function') window.renderCatalog();
    if (typeof window.initApp === 'function' && !window._appInitialized) {
      window._appInitialized = true;
      window.initApp();
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
      }
      return { ...INITIAL_SETTINGS };
    } catch (e) {
      return { ...INITIAL_SETTINGS };
    }
  },

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    if (db) db.ref('urbanmex/settings').set(updated);
    return updated;
  },

  getBrands() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANDS);
      if (data) return JSON.parse(data);
      return [...INITIAL_BRANDS];
    } catch (e) {
      return [...INITIAL_BRANDS];
    }
  },

  saveBrands(brands) {
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
    if (db) db.ref('urbanmex/brands').set(brands);
  },

  addBrand(brandName) {
    const cleanName = (brandName || '').trim();
    if (!cleanName) return { success: false, error: 'El nombre de la marca no puede estar vacío.' };

    const brands = this.getBrands();
    const exists = brands.some(b => b.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      return { success: false, error: 'Esta marca ya existe en el catálogo.' };
    }

    brands.push(cleanName);
    this.saveBrands(brands);
    return { success: true, brand: cleanName, brands };
  },

  deleteBrand(brandName) {
    const brands = this.getBrands().filter(b => b.toLowerCase() !== brandName.toLowerCase());
    this.saveBrands(brands);
    return brands;
  },

  getProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
      return [...INITIAL_PRODUCTS];
    } catch (e) {
      return [...INITIAL_PRODUCTS];
    }
  },

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    if (db) db.ref('urbanmex/products').set(products);
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  addProduct(productData) {
    const products = this.getProducts();
    const nextNum = products.length + 1;
    const rawPrice = parseFloat(productData.price);
    const validPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : 0;

    const newProduct = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: (productData.name || `Camisa ${nextNum}`).trim(),
      brand: productData.category === 'custom' ? 'Personalizada' : (productData.brand || 'General').trim(),
      category: productData.category || 'brand',
      price: validPrice,
      description: (productData.description || '').trim(),
      image: (productData.image || '').trim(),
      createdAt: Date.now()
    };

    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id, productData) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const rawPrice = parseFloat(productData.price);
    const validPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : products[index].price;

    products[index] = {
      ...products[index],
      name: (productData.name !== undefined ? productData.name : products[index].name).trim(),
      brand: productData.category === 'custom' ? 'Personalizada' : (productData.brand || products[index].brand).trim(),
      category: productData.category || products[index].category,
      price: validPrice,
      description: (productData.description !== undefined ? productData.description : products[index].description).trim(),
      image: productData.image !== undefined ? productData.image : products[index].image,
      updatedAt: Date.now()
    };

    this.saveProducts(products);
    return products[index];
  },

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
    return true;
  },

  resetToDefaults() {
    this.saveSettings(INITIAL_SETTINGS);
    this.saveBrands(INITIAL_BRANDS);
    this.saveProducts(INITIAL_PRODUCTS);
  },

  isAdminAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  },

  loginAdmin(pin) {
    const settings = this.getSettings();
    if ((pin || '').trim() === (settings.adminPin || '1234').trim()) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  },

  logoutAdmin() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.78) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#09090d';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });
  },

  getDefaultImagePlaceholder() {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="100%" height="100%" fill="%230b0b0f"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="500" fill="%2352525b" letter-spacing="3">SIN IMAGEN</text></svg>`;
  },

  getWhatsAppLink(product) {
    const settings = this.getSettings();
    let phone = (settings.whatsapp || '').replace(/[^0-9]/g, '');
    if (!phone) phone = '51900000000';

    const brandText = product.category === 'custom' ? 'Personalizada' : product.brand;
    const priceText = this.formatPrice(product.price);

    const message = `🔥 ¡Hola *${settings.storeName}*! Me interesa pedir esta camisa del catálogo:

👕 *${product.name}*
🏷️ *Marca/Tipo:* ${brandText}
💰 *Precio:* ${priceText}
📝 *Detalles:* ${product.description || 'Consultar tallas'}

¿Tienen disponibilidad para coordinar el pedido?`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  formatPrice(price) {
    const settings = this.getSettings();
    const val = parseFloat(price);
    const safeVal = !isNaN(val) && val >= 0 ? val : 0;
    const curr = settings.currency || 'S/ ';
    return `${curr}${safeVal.toFixed(2)}`;
  }
};

window.Store = Store;
Store.initCloudSync();