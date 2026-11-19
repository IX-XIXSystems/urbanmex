/**
 * Frontend Public Catalog - URBAN MEX
 * Tarjetas limpias, proporciones exactas y recuadro elegante "SIN IMAGEN".
 */

document.addEventListener('DOMContentLoaded', () => {
  let activeCategory = 'brand';
  let activeBrand = 'all';
  let searchQuery = '';

  const segmentedControl = document.getElementById('segmentedControl');
  const brandFiltersWrapper = document.getElementById('brandFiltersWrapper');
  const customBanner = document.getElementById('customBanner');
  const customBannerText = document.getElementById('customBannerText');
  const searchInput = document.getElementById('searchInput');
  const catalogCount = document.getElementById('catalogCount');
  const productsGrid = document.getElementById('productsGrid');

  const productModal = document.getElementById('productModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImgWrap = document.getElementById('modalImgWrap');
  const modalBrandBadge = document.getElementById('modalBrandBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPrice = document.getElementById('modalPrice');
  const modalWaBtn = document.getElementById('modalWaBtn');

  function applySettings() {
    const settings = Store.getSettings();
    document.querySelectorAll('.dynamic-store-name').forEach(el => {
      el.textContent = settings.storeName || 'URBAN MEX';
    });
    const taglineEl = document.getElementById('dynamicTagline');
    if (taglineEl) {
      taglineEl.textContent = `✦ ${settings.tagline || 'Te lo hacen realidad!'}`;
    }
  }

  function renderCategoryTabs() {
    const categories = Store.getCategories();
    if (!categories.some(c => c.id === activeCategory)) {
      activeCategory = categories[0] ? categories[0].id : 'brand';
    }

    segmentedControl.innerHTML = categories.map(cat => {
      const isActive = cat.id === activeCategory;
      return `
        <button type="button" class="segment-btn ${isActive ? 'active' : ''}" data-category="${cat.id}" role="tab" aria-selected="${isActive}">
          <span>${cat.name}</span>
        </button>
      `;
    }).join('');

    segmentedControl.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-category');
        activeBrand = 'all';
        renderAll();
      });
    });
  }

  function renderBrandFilters() {
    const catObj = Store.getCategoryById(activeCategory);

    if (!catObj || !catObj.hasBrands) {
      brandFiltersWrapper.style.display = 'none';
      if (catObj && catObj.banner) {
        customBanner.style.display = 'block';
        if (customBannerText) customBannerText.innerHTML = catObj.banner;
      } else {
        customBanner.style.display = 'none';
      }
      return;
    }

    customBanner.style.display = 'none';
    brandFiltersWrapper.style.display = 'flex';

    const brands = Store.getBrands();
    const allCatProducts = Store.getProducts().filter(p => p.category === activeCategory);

    const pills = [
      { id: 'all', label: 'Todas', count: allCatProducts.length },
      ...brands.map(b => ({
        id: b,
        label: b,
        count: allCatProducts.filter(p => (p.brand || '').toLowerCase() === b.toLowerCase()).length
      }))
    ];

    brandFiltersWrapper.innerHTML = pills.map(pill => {
      const isActive = activeBrand.toLowerCase() === pill.id.toLowerCase();
      return `
        <button type="button" class="brand-chip ${isActive ? 'active' : ''}" data-brand="${pill.id}"
          style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:10px; font-size:0.76rem; font-weight:700; cursor:pointer; border:1px solid ${isActive ? '#ffffff' : 'rgba(255,255,255,0.08)'}; background:${isActive ? '#ffffff' : 'rgba(255,255,255,0.04)'}; color:${isActive ? '#050507' : '#a1a1aa'}; transition:all 0.2s;">
          <span>${pill.label}</span>
          <span style="font-size:0.68rem; opacity:0.7;">${pill.count}</span>
        </button>
      `;
    }).join('');

    brandFiltersWrapper.querySelectorAll('.brand-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeBrand = btn.getAttribute('data-brand');
        renderBrandFilters();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    const catObj = Store.getCategoryById(activeCategory);
    let products = Store.getProducts().filter(p => p.category === activeCategory);

    if (catObj && catObj.hasBrands && activeBrand !== 'all') {
      products = products.filter(p => (p.brand || '').toLowerCase() === activeBrand.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    if (catalogCount) {
      catalogCount.textContent = `${products.length} ${products.length === 1 ? 'MODELO' : 'MODELOS'}`;
    }

    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:16px;">
          <p style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">No hay modelos en este apartado todavía</p>
          <p style="font-size:0.8rem; color:var(--text-muted);">Pronto subiremos nuevos diseños.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = products.map(prod => {
      const hasImage = prod.image && prod.image.trim() !== '';
      const badgeLabel = (catObj && catObj.hasBrands) ? (prod.brand || 'Marca') : (catObj ? catObj.name : prod.brand);
      const waLink = Store.getWhatsAppLink(prod);

      const mediaHtml = hasImage
        ? `<img src="${prod.image}" alt="${prod.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.outerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0b0b0f;color:#52525b;font-size:0.74rem;font-weight:700;letter-spacing:0.2em;\\'>SIN IMAGEN</div>'">`
        : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#0b0b0f; color:#52525b; font-size:0.74rem; font-weight:700; letter-spacing:0.2em; user-select:none;">SIN IMAGEN</div>`;

      return `
        <article class="product-card" data-id="${prod.id}">
          <div class="product-img-box" style="position:relative; width:100%; height:240px; background:#0b0b0f; overflow:hidden; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span class="badge-brand" style="position:absolute; top:10px; left:10px; z-index:2; text-transform:uppercase;">${badgeLabel}</span>
            ${mediaHtml}
          </div>
          <div class="product-info">
            <div>
              <h3 class="product-title" style="font-size:0.95rem; font-weight:800; color:var(--text-main); cursor:pointer; margin-bottom:4px;">${prod.name}</h3>
              <p class="product-desc" style="font-size:0.76rem; color:var(--text-secondary); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${prod.description || ''}</p>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
              <span class="product-price" style="font-weight:800; font-size:0.98rem; color:var(--text-main);">${Store.formatPrice(prod.price)}</span>
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="padding:7px 11px; font-size:0.75rem;">
                <span>Pedir</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    productsGrid.querySelectorAll('.product-card').forEach(card => {
      const id = card.getAttribute('data-id');
      card.querySelector('.product-img-box').addEventListener('click', () => openModal(id));
      card.querySelector('.product-title').addEventListener('click', () => openModal(id));
    });
  }

  function openModal(productId) {
    const prod = Store.getProductById(productId);
    if (!prod) return;

    const catObj = Store.getCategoryById(prod.category);
    const badgeLabel = (catObj && catObj.hasBrands) ? (prod.brand || 'Marca') : (catObj ? catObj.name : prod.brand);
    const hasImage = prod.image && prod.image.trim() !== '';

    if (hasImage) {
      modalImgWrap.innerHTML = `<img id="modalImg" src="${prod.image}" alt="${prod.name}" style="width:100%; height:300px; object-fit:contain; background:#08080c; border-radius:12px; display:block;" onerror="this.outerHTML='<div style=\\'width:100%;height:240px;display:flex;align-items:center;justify-content:center;background:#0b0b0f;color:#52525b;font-size:0.82rem;font-weight:700;letter-spacing:0.22em;border-radius:12px;\\'>SIN IMAGEN</div>'">`;
    } else {
      modalImgWrap.innerHTML = `<div style="width:100%; height:240px; display:flex; align-items:center; justify-content:center; background:#0b0b0f; color:#52525b; font-size:0.82rem; font-weight:700; letter-spacing:0.22em; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">SIN IMAGEN</div>`;
    }

    modalBrandBadge.textContent = badgeLabel;
    modalTitle.textContent = prod.name;
    modalDesc.textContent = prod.description || 'Consulta tallas y disponibilidad por WhatsApp.';
    modalPrice.textContent = Store.formatPrice(prod.price);
    modalWaBtn.href = Store.getWhatsAppLink(prod);

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.classList.contains('active')) closeModal();
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  function renderAll() {
    applySettings();
    renderCategoryTabs();
    renderBrandFilters();
    renderProducts();
  }

  window.addEventListener('urbanmex:sync', renderAll);
  window.addEventListener('storage', renderAll);

  renderAll();
});