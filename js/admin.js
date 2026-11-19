/**
 * Admin Panel Logic - URBAN MEX
 * Inventario compacto, gestión de Apartados, Marcas y Configuración con Firebase.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginPin = document.getElementById('loginPin');
  const btnLogout = document.getElementById('btnLogout');

  const statProductsCount = document.getElementById('statProductsCount');
  const statCategoriesCount = document.getElementById('statCategoriesCount');
  const statBrandsCount = document.getElementById('statBrandsCount');

  // Formulario Productos
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');
  const editProductId = document.getElementById('editProductId');
  const productCategory = document.getElementById('productCategory');
  const btnQuickAddCategory = document.getElementById('btnQuickAddCategory');
  const brandSelectGroup = document.getElementById('brandSelectGroup');
  const productBrand = document.getElementById('productBrand');
  const btnQuickAddBrand = document.getElementById('btnQuickAddBrand');
  const productName = document.getElementById('productName');
  const productPrice = document.getElementById('productPrice');
  const productDesc = document.getElementById('productDesc');
  const fileInput = document.getElementById('fileInput');
  const dropzoneBox = document.getElementById('dropzoneBox');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const productImageUrl = document.getElementById('productImageUrl');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnResetForm = document.getElementById('btnResetForm');

  // Inventario
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminFilterType = document.getElementById('adminFilterType');
  const adminProductsList = document.getElementById('adminProductsList');

  // Apartados
  const categoryForm = document.getElementById('categoryForm');
  const newCategoryName = document.getElementById('newCategoryName');
  const newCategoryHasBrands = document.getElementById('newCategoryHasBrands');
  const newCategoryBanner = document.getElementById('newCategoryBanner');
  const adminCategoriesList = document.getElementById('adminCategoriesList');

  // Marcas
  const brandForm = document.getElementById('brandForm');
  const newBrandName = document.getElementById('newBrandName');
  const adminBrandsList = document.getElementById('adminBrandsList');

  // Configuración
  const settingsForm = document.getElementById('settingsForm');
  const settingStoreName = document.getElementById('settingStoreName');
  const settingStoreTagline = document.getElementById('settingStoreTagline');
  const settingWhatsapp = document.getElementById('settingWhatsapp');
  const settingCurrency = document.getElementById('settingCurrency');
  const settingAdminPin = document.getElementById('settingAdminPin');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  let currentImageBase64 = '';

  function showToast(msg, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `background:${isError ? '#991b1b' : '#18181b'}; color:#fff; border:1px solid ${isError ? '#ef4444' : 'rgba(255,255,255,0.15)'}; padding:12px 16px; border-radius:10px; font-size:0.82rem; font-weight:600; margin-top:8px; box-shadow:0 10px 25px rgba(0,0,0,0.5);`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  function checkAuth() {
    if (Store.isAdminAuthenticated()) {
      loginScreen.style.display = 'none';
      adminDashboard.style.display = 'block';
      btnLogout.style.display = 'inline-flex';
      refreshAdminUI();
    } else {
      loginScreen.style.display = 'block';
      adminDashboard.style.display = 'none';
      btnLogout.style.display = 'none';
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Store.loginAdmin(loginPin.value)) {
      loginPin.value = '';
      checkAuth();
      showToast('Bienvenido al Panel URBAN MEX');
    } else {
      showToast('PIN incorrecto', true);
      loginPin.value = '';
    }
  });

  btnLogout.addEventListener('click', () => {
    Store.logoutAdmin();
    checkAuth();
  });

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.admin-tab-content').forEach(sec => sec.style.display = 'none');

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.style.display = 'block';
    });
  });

  function updateBrandGroupVisibility() {
    const catObj = Store.getCategoryById(productCategory.value);
    brandSelectGroup.style.display = (catObj && catObj.hasBrands) ? 'block' : 'none';
  }

  productCategory.addEventListener('change', updateBrandGroupVisibility);

  function setPreviewImage(src) {
    currentImageBase64 = src || '';
    if (currentImageBase64) {
      imagePreviewImg.src = currentImageBase64;
      imagePreviewContainer.style.display = 'block';
      dropzonePrompt.style.display = 'none';
      btnRemoveImage.style.display = 'inline-flex';
    } else {
      imagePreviewImg.src = '';
      imagePreviewContainer.style.display = 'none';
      dropzonePrompt.style.display = 'block';
      btnRemoveImage.style.display = 'none';
      fileInput.value = '';
      productImageUrl.value = '';
    }
  }

  dropzoneBox.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await Store.compressImage(file);
      setPreviewImage(compressed);
      showToast('Imagen optimizada lista');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  productImageUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) setPreviewImage(url);
  });

  btnRemoveImage.addEventListener('click', () => setPreviewImage(''));

  btnQuickAddCategory.addEventListener('click', () => {
    const name = prompt('Nombre del nuevo apartado (ej. Gorras, Pantalones):');
    if (!name) return;
    const res = Store.addCategory(name);
    if (res.success) {
      refreshAdminUI();
      productCategory.value = res.category.id;
      updateBrandGroupVisibility();
      showToast(`Apartado "${res.category.name}" creado`);
    } else {
      showToast(res.error, true);
    }
  });

  btnQuickAddBrand.addEventListener('click', () => {
    const name = prompt('Nombre de la nueva marca:');
    if (!name) return;
    const res = Store.addBrand(name);
    if (res.success) {
      refreshAdminUI();
      productBrand.value = res.brand;
      showToast(`Marca "${res.brand}" agregada`);
    } else {
      showToast(res.error, true);
    }
  });

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editProductId.value;
    const data = {
      category: productCategory.value,
      brand: productBrand.value,
      name: productName.value,
      price: productPrice.value,
      description: productDesc.value,
      image: currentImageBase64
    };

    if (id) {
      Store.updateProduct(id, data);
      showToast('Producto actualizado en la nube');
    } else {
      Store.addProduct(data);
      showToast('Producto publicado en la nube');
    }

    resetProductForm();
    refreshAdminUI();
  });

  function resetProductForm() {
    productForm.reset();
    editProductId.value = '';
    formTitle.textContent = 'Subir Producto';
    btnCancelEdit.style.display = 'none';
    setPreviewImage('');
    updateBrandGroupVisibility();
  }

  btnResetForm.addEventListener('click', resetProductForm);
  btnCancelEdit.addEventListener('click', resetProductForm);

  function populateSelectors() {
    const categories = Store.getCategories();
    const brands = Store.getBrands();
    const currentCat = productCategory.value;
    const currentBrand = productBrand.value;
    const currentFilter = adminFilterType.value;

    productCategory.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (categories.some(c => c.id === currentCat)) productCategory.value = currentCat;

    productBrand.innerHTML = brands.map(b => `<option value="${b}">${b}</option>`).join('');
    if (brands.includes(currentBrand)) productBrand.value = currentBrand;

    adminFilterType.innerHTML = `<option value="all">Todos los apartados</option>` +
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (currentFilter === 'all' || categories.some(c => c.id === currentFilter)) {
      adminFilterType.value = currentFilter;
    }

    updateBrandGroupVisibility();
  }

  function renderAdminProducts() {
    const q = (adminSearchInput.value || '').toLowerCase().trim();
    const filterCat = adminFilterType.value;
    let products = Store.getProducts();

    if (filterCat !== 'all') {
      products = products.filter(p => p.category === filterCat);
    }
    if (q) {
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    if (products.length === 0) {
      adminProductsList.innerHTML = `<p style="font-size:0.82rem; color:var(--text-muted); text-align:center; padding:20px;">No se encontraron productos.</p>`;
      return;
    }

    adminProductsList.innerHTML = products.map(prod => {
      const catObj = Store.getCategoryById(prod.category);
      const catLabel = catObj ? catObj.name : prod.category;
      const hasImage = prod.image && prod.image.trim() !== '';

      const thumbHtml = hasImage
        ? `<img src="${prod.image}" alt="" style="width:48px; height:48px; min-width:48px; max-width:48px; max-height:48px; object-fit:cover; border-radius:8px; display:block; border:1px solid rgba(255,255,255,0.08);" onerror="this.outerHTML='<div style=\\'width:48px;height:48px;min-width:48px;border-radius:8px;background:#0b0b0f;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#52525b;text-align:center;line-height:1.1;\\'>SIN<br>IMAGEN</div>'">`
        : `<div style="width:48px; height:48px; min-width:48px; border-radius:8px; background:#0b0b0f; border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; color:#52525b; text-align:center; line-height:1.1; letter-spacing:0.05em;">SIN<br>IMAGEN</div>`;

      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-light); border-radius:10px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            ${thumbHtml}
            <div style="min-width:0;">
              <strong style="display:block; font-size:0.88rem; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prod.name}</strong>
              <span style="font-size:0.75rem; color:var(--text-secondary);">${Store.formatPrice(prod.price)} • ${catLabel}${catObj && catObj.hasBrands ? ` (${prod.brand})` : ''}</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" class="btn btn-secondary btn-sm" data-edit-prod="${prod.id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-prod="${prod.id}">Borrar</button>
          </div>
        </div>
      `;
    }).join('');

    adminProductsList.querySelectorAll('[data-edit-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = Store.getProductById(btn.getAttribute('data-edit-prod'));
        if (!prod) return;
        editProductId.value = prod.id;
        productCategory.value = prod.category;
        updateBrandGroupVisibility();
        if (prod.brand) productBrand.value = prod.brand;
        productName.value = prod.name;
        productPrice.value = prod.price;
        productDesc.value = prod.description || '';
        setPreviewImage(prod.image || '');
        formTitle.textContent = `Editando: ${prod.name}`;
        btnCancelEdit.style.display = 'inline-flex';
        document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
      });
    });

    adminProductsList.querySelectorAll('[data-del-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este producto del catálogo?')) {
          Store.deleteProduct(btn.getAttribute('data-del-prod'));
          showToast('Producto eliminado');
          refreshAdminUI();
        }
      });
    });
  }

  adminSearchInput.addEventListener('input', renderAdminProducts);
  adminFilterType.addEventListener('change', renderAdminProducts);

  // Gestión de Apartados
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = Store.addCategory(
      newCategoryName.value,
      newCategoryBanner.value,
      newCategoryHasBrands ? newCategoryHasBrands.checked : false
    );
    if (res.success) {
      newCategoryName.value = '';
      newCategoryBanner.value = '';
      if (newCategoryHasBrands) newCategoryHasBrands.checked = false;
      showToast(`Apartado "${res.category.name}" creado`);
      refreshAdminUI();
    } else {
      showToast(res.error, true);
    }
  });

  function renderAdminCategories() {
    const categories = Store.getCategories();
    const products = Store.getProducts();

    adminCategoriesList.innerHTML = categories.map(cat => {
      const count = products.filter(p => p.category === cat.id).length;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:10px;">
          <div>
            <strong style="display:block; font-size:0.9rem; color:var(--text-main); text-transform:uppercase; letter-spacing:0.04em;">${cat.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${count} productos ${cat.hasBrands ? '• Con filtro de marcas' : ''}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" data-rename-cat="${cat.id}">Renombrar</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-cat="${cat.id}">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    adminCategoriesList.querySelectorAll('[data-rename-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = Store.getCategoryById(btn.getAttribute('data-rename-cat'));
        if (!cat) return;
        const nuevoNombre = prompt('Escribe el nuevo nombre para este apartado:', cat.name);
        if (nuevoNombre && nuevoNombre.trim() !== '') {
          const res = Store.updateCategory(cat.id, nuevoNombre);
          if (res.success) {
            showToast(`Apartado actualizado a "${res.category.name}"`);
            refreshAdminUI();
          }
        }
      });
    });

    adminCategoriesList.querySelectorAll('[data-del-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este apartado del menú principal?')) {
/**
 * Admin Panel Logic - URBAN MEX
 * Confirma el guardado en la nube y formatea automáticamente el número de WhatsApp.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginPin = document.getElementById('loginPin');
  const btnLogout = document.getElementById('btnLogout');

  const statProductsCount = document.getElementById('statProductsCount');
  const statCategoriesCount = document.getElementById('statCategoriesCount');
  const statBrandsCount = document.getElementById('statBrandsCount');

  // Formulario Productos
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');
  const editProductId = document.getElementById('editProductId');
  const productCategory = document.getElementById('productCategory');
  const btnQuickAddCategory = document.getElementById('btnQuickAddCategory');
  const brandSelectGroup = document.getElementById('brandSelectGroup');
  const productBrand = document.getElementById('productBrand');
  const btnQuickAddBrand = document.getElementById('btnQuickAddBrand');
  const productName = document.getElementById('productName');
  const productPrice = document.getElementById('productPrice');
  const productDesc = document.getElementById('productDesc');
  const fileInput = document.getElementById('fileInput');
  const dropzoneBox = document.getElementById('dropzoneBox');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const productImageUrl = document.getElementById('productImageUrl');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnResetForm = document.getElementById('btnResetForm');

  // Inventario
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminFilterType = document.getElementById('adminFilterType');
  const adminProductsList = document.getElementById('adminProductsList');

  // Apartados
  const categoryForm = document.getElementById('categoryForm');
  const newCategoryName = document.getElementById('newCategoryName');
  const newCategoryHasBrands = document.getElementById('newCategoryHasBrands');
  const newCategoryBanner = document.getElementById('newCategoryBanner');
  const adminCategoriesList = document.getElementById('adminCategoriesList');

  // Marcas
  const brandForm = document.getElementById('brandForm');
  const newBrandName = document.getElementById('newBrandName');
  const adminBrandsList = document.getElementById('adminBrandsList');

  // Configuración
  const settingsForm = document.getElementById('settingsForm');
  const settingStoreName = document.getElementById('settingStoreName');
  const settingStoreTagline = document.getElementById('settingStoreTagline');
  const settingWhatsapp = document.getElementById('settingWhatsapp');
  const settingCurrency = document.getElementById('settingCurrency');
  const settingAdminPin = document.getElementById('settingAdminPin');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  let currentImageBase64 = '';

  function showToast(msg, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `background:${isError ? '#991b1b' : '#18181b'}; color:#fff; border:1px solid ${isError ? '#ef4444' : 'rgba(255,255,255,0.15)'}; padding:12px 16px; border-radius:10px; font-size:0.82rem; font-weight:600; margin-top:8px; box-shadow:0 10px 25px rgba(0,0,0,0.5);`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function checkAuth() {
    if (Store.isAdminAuthenticated()) {
      loginScreen.style.display = 'none';
      adminDashboard.style.display = 'block';
      btnLogout.style.display = 'inline-flex';
      refreshAdminUI();
    } else {
      loginScreen.style.display = 'block';
      adminDashboard.style.display = 'none';
      btnLogout.style.display = 'none';
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Store.loginAdmin(loginPin.value)) {
      loginPin.value = '';
      checkAuth();
      showToast('Bienvenido al Panel URBAN MEX');
    } else {
      showToast('PIN incorrecto', true);
      loginPin.value = '';
    }
  });

  btnLogout.addEventListener('click', () => {
    Store.logoutAdmin();
    checkAuth();
  });

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.admin-tab-content').forEach(sec => sec.style.display = 'none');

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.style.display = 'block';
    });
  });

  function updateBrandGroupVisibility() {
    const catObj = Store.getCategoryById(productCategory.value);
    brandSelectGroup.style.display = (catObj && catObj.hasBrands) ? 'block' : 'none';
  }

  productCategory.addEventListener('change', updateBrandGroupVisibility);

  function setPreviewImage(src) {
    currentImageBase64 = src || '';
    if (currentImageBase64) {
      imagePreviewImg.src = currentImageBase64;
      imagePreviewContainer.style.display = 'block';
      dropzonePrompt.style.display = 'none';
      btnRemoveImage.style.display = 'inline-flex';
    } else {
      imagePreviewImg.src = '';
      imagePreviewContainer.style.display = 'none';
      dropzonePrompt.style.display = 'block';
      btnRemoveImage.style.display = 'none';
      fileInput.value = '';
      productImageUrl.value = '';
    }
  }

  dropzoneBox.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await Store.compressImage(file);
      setPreviewImage(compressed);
      showToast('Imagen optimizada lista');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  productImageUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) setPreviewImage(url);
  });

  btnRemoveImage.addEventListener('click', () => setPreviewImage(''));

  btnQuickAddCategory.addEventListener('click', () => {
    const name = prompt('Nombre del nuevo apartado (ej. Gorras, Pantalones):');
    if (!name) return;
    const res = Store.addCategory(name);
    if (res.success) {
      refreshAdminUI();
      productCategory.value = res.category.id;
      updateBrandGroupVisibility();
      showToast(`Apartado "${res.category.name}" creado`);
    } else {
      showToast(res.error, true);
    }
  });

  btnQuickAddBrand.addEventListener('click', () => {
    const name = prompt('Nombre de la nueva marca:');
    if (!name) return;
    const res = Store.addBrand(name);
    if (res.success) {
      refreshAdminUI();
      productBrand.value = res.brand;
      showToast(`Marca "${res.brand}" agregada`);
    } else {
      showToast(res.error, true);
    }
  });

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editProductId.value;
    const data = {
      category: productCategory.value,
      brand: productBrand.value,
      name: productName.value,
      price: productPrice.value,
      description: productDesc.value,
      image: currentImageBase64
    };

    if (id) {
      Store.updateProduct(id, data);
      showToast('Producto actualizado en la nube');
    } else {
      Store.addProduct(data);
      showToast('Producto publicado en la nube');
    }

    resetProductForm();
    refreshAdminUI();
  });

  function resetProductForm() {
    productForm.reset();
    editProductId.value = '';
    formTitle.textContent = 'Subir Producto';
    btnCancelEdit.style.display = 'none';
    setPreviewImage('');
    updateBrandGroupVisibility();
  }

  btnResetForm.addEventListener('click', resetProductForm);
  btnCancelEdit.addEventListener('click', resetProductForm);

  function populateSelectors() {
    const categories = Store.getCategories();
    const brands = Store.getBrands();
    const currentCat = productCategory.value;
    const currentBrand = productBrand.value;
    const currentFilter = adminFilterType.value;

    productCategory.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (categories.some(c => c.id === currentCat)) productCategory.value = currentCat;

    productBrand.innerHTML = brands.map(b => `<option value="${b}">${b}</option>`).join('');
    if (brands.includes(currentBrand)) productBrand.value = currentBrand;

    adminFilterType.innerHTML = `<option value="all">Todos los apartados</option>` +
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (currentFilter === 'all' || categories.some(c => c.id === currentFilter)) {
      adminFilterType.value = currentFilter;
    }

    updateBrandGroupVisibility();
  }

  function renderAdminProducts() {
    const q = (adminSearchInput.value || '').toLowerCase().trim();
    const filterCat = adminFilterType.value;
    let products = Store.getProducts();

    if (filterCat !== 'all') {
      products = products.filter(p => p.category === filterCat);
    }
    if (q) {
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    if (products.length === 0) {
      adminProductsList.innerHTML = `<p style="font-size:0.82rem; color:var(--text-muted); text-align:center; padding:20px;">No se encontraron productos.</p>`;
      return;
    }

    adminProductsList.innerHTML = products.map(prod => {
      const catObj = Store.getCategoryById(prod.category);
      const catLabel = catObj ? catObj.name : prod.category;
      const hasImage = prod.image && prod.image.trim() !== '';

      const thumbHtml = hasImage
        ? `<img src="${prod.image}" alt="" style="width:48px; height:48px; min-width:48px; max-width:48px; max-height:48px; object-fit:cover; border-radius:8px; display:block; border:1px solid rgba(255,255,255,0.08);" onerror="this.outerHTML='<div style=\\'width:48px;height:48px;min-width:48px;border-radius:8px;background:#0b0b0f;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#52525b;text-align:center;line-height:1.1;\\'>SIN<br>IMAGEN</div>'">`
        : `<div style="width:48px; height:48px; min-width:48px; border-radius:8px; background:#0b0b0f; border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; color:#52525b; text-align:center; line-height:1.1; letter-spacing:0.05em;">SIN<br>IMAGEN</div>`;

      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-light); border-radius:10px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            ${thumbHtml}
            <div style="min-width:0;">
              <strong style="display:block; font-size:0.88rem; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${prod.name}</strong>
              <span style="font-size:0.75rem; color:var(--text-secondary);">${Store.formatPrice(prod.price)} • ${catLabel}${catObj && catObj.hasBrands ? ` (${prod.brand})` : ''}</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" class="btn btn-secondary btn-sm" data-edit-prod="${prod.id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-prod="${prod.id}">Borrar</button>
          </div>
        </div>
      `;
    }).join('');

    adminProductsList.querySelectorAll('[data-edit-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = Store.getProductById(btn.getAttribute('data-edit-prod'));
        if (!prod) return;
        editProductId.value = prod.id;
        productCategory.value = prod.category;
        updateBrandGroupVisibility();
        if (prod.brand) productBrand.value = prod.brand;
        productName.value = prod.name;
        productPrice.value = prod.price;
        productDesc.value = prod.description || '';
        setPreviewImage(prod.image || '');
        formTitle.textContent = `Editando: ${prod.name}`;
        btnCancelEdit.style.display = 'inline-flex';
        document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
      });
    });

    adminProductsList.querySelectorAll('[data-del-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este producto del catálogo?')) {
          Store.deleteProduct(btn.getAttribute('data-del-prod'));
          showToast('Producto eliminado');
          refreshAdminUI();
        }
      });
    });
  }

  adminSearchInput.addEventListener('input', renderAdminProducts);
  adminFilterType.addEventListener('change', renderAdminProducts);

  // Gestión de Apartados
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = Store.addCategory(
      newCategoryName.value,
      newCategoryBanner.value,
      newCategoryHasBrands ? newCategoryHasBrands.checked : false
    );
    if (res.success) {
      newCategoryName.value = '';
      newCategoryBanner.value = '';
      if (newCategoryHasBrands) newCategoryHasBrands.checked = false;
      showToast(`Apartado "${res.category.name}" creado`);
      refreshAdminUI();
    } else {
      showToast(res.error, true);
    }
  });

  function renderAdminCategories() {
    const categories = Store.getCategories();
    const products = Store.getProducts();

    adminCategoriesList.innerHTML = categories.map(cat => {
      const count = products.filter(p => p.category === cat.id).length;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:10px;">
          <div>
            <strong style="display:block; font-size:0.9rem; color:var(--text-main); text-transform:uppercase; letter-spacing:0.04em;">${cat.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${count} productos ${cat.hasBrands ? '• Con filtro de marcas' : ''}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" data-rename-cat="${cat.id}">Renombrar</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-cat="${cat.id}">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    adminCategoriesList.querySelectorAll('[data-rename-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = Store.getCategoryById(btn.getAttribute('data-rename-cat'));
        if (!cat) return;
        const nuevoNombre = prompt('Escribe el nuevo nombre para este apartado:', cat.name);
        if (nuevoNombre && nuevoNombre.trim() !== '') {
          const res = Store.updateCategory(cat.id, nuevoNombre);
          if (res.success) {
            showToast(`Apartado actualizado a "${res.category.name}"`);
            refreshAdminUI();
          }
        }
      });
    });

    adminCategoriesList.querySelectorAll('[data-del-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este apartado del menú principal?')) {
          const res = Store.deleteCategory(btn.getAttribute('data-del-cat'));
          if (res.success) {
            showToast('Apartado eliminado');
            refreshAdminUI();
          } else {
            showToast(res.error, true);
          }
        }
      });
    });
  }

  // Gestión de Marcas
  brandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = Store.addBrand(newBrandName.value);
    if (res.success) {
      newBrandName.value = '';
      showToast(`Marca "${res.brand}" agregada`);
      refreshAdminUI();
    } else {
      showToast(res.error, true);
    }
  });

  function renderAdminBrands() {
    const brands = Store.getBrands();
    adminBrandsList.innerHTML = brands.map(b => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:10px;">
        <span style="font-weight:700; font-size:0.86rem; color:var(--text-main);">${b}</span>
        <button type="button" class="btn btn-danger btn-sm" data-del-brand="${b}">✕</button>
      </div>
    `).join('');

    adminBrandsList.querySelectorAll('[data-del-brand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-del-brand');
        if (confirm(`¿Eliminar la marca ${name}?`)) {
          Store.deleteBrand(name);
          showToast('Marca eliminada');
          refreshAdminUI();
        }
      });
    });
  }

  // Configuración
  function loadSettingsForm() {
    const s = Store.getSettings();
    document.querySelectorAll('.currency-label').forEach(el => el.textContent = (s.currency || 'S/').trim());
    document.querySelectorAll('.dynamic-store-name').forEach(el => el.textContent = s.storeName || 'URBAN MEX');

    if (settingsForm && settingsForm.contains(document.activeElement)) return;

    settingStoreName.value = s.storeName || '';
    settingStoreTagline.value = s.tagline || '';
    settingWhatsapp.value = s.whatsapp || '51931986950';
    settingCurrency.value = s.currency || 'S/ ';
    settingAdminPin.value = s.adminPin || '1234';
  }

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let rawPhone = settingWhatsapp.value.replace(/[^0-9]/g, '');

    if (rawPhone.length === 9 && rawPhone.startsWith('9')) {
      rawPhone = '51' + rawPhone;
    }

    if (rawPhone.length < 10) {
      showToast('Número inválido. Incluye el código de país (ej. 51931986950)', true);
      settingWhatsapp.focus();
      return;
    }

    Store.saveSettings({
      storeName: settingStoreName.value.trim(),
      tagline: settingStoreTagline.value.trim(),
      whatsapp: rawPhone,
      currency: settingCurrency.value,
      adminPin: settingAdminPin.value.trim()
    }).then((saved) => {
      settingWhatsapp.value = saved.whatsapp;
      showToast(`Guardado en la nube: +${saved.whatsapp}`);
      refreshAdminUI();
    }).catch((err) => {
      showToast('Error al guardar en Firebase: ' + err.message, true);
    });
  });

  btnResetDefaults.addEventListener('click', () => {
    if (confirm('¿Seguro que deseas restablecer todo el catálogo a los valores iniciales?')) {
      Store.resetToDefaults();
      showToast('Catálogo restablecido');
      refreshAdminUI();
    }
  });

  function refreshAdminUI() {
    if (!Store.isAdminAuthenticated()) return;
    const products = Store.getProducts();
    const categories = Store.getCategories();
    const brands = Store.getBrands();

    statProductsCount.textContent = products.length;
    statCategoriesCount.textContent = categories.length;
    statBrandsCount.textContent = brands.length;

    populateSelectors();
    renderAdminProducts();
    renderAdminCategories();
    renderAdminBrands();
    loadSettingsForm();
  }

  window.addEventListener('urbanmex:sync', refreshAdminUI);
  window.addEventListener('storage', refreshAdminUI);

  checkAuth();
});
