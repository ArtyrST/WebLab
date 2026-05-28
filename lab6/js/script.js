// ====================================================
//  Лабораторна робота №6 — Варіант 16
//  Форма додавання товару в базу даних (JavaScript)
// ====================================================

// Масив для зберігання товарів (імітація бази даних)
let products = [];
let idCounter = 1;

// ── Отримання елементів форми ──────────────────────
const form         = document.getElementById('productForm');
const productName  = document.getElementById('productName');
const category     = document.getElementById('category');
const price        = document.getElementById('price');
const quantity     = document.getElementById('quantity');
const sku          = document.getElementById('sku');
const description  = document.getElementById('description');
const brand        = document.getElementById('brand');
const inStock      = document.getElementById('inStock');
const submitBtn    = document.getElementById('submitBtn');
const resetBtn     = document.getElementById('resetBtn');
const errorSummary = document.getElementById('errorSummary');
const successAlert = document.getElementById('successAlert');
const tableBody    = document.getElementById('productTableBody');
const emptyRow     = document.getElementById('emptyRow');
const totalCount   = document.getElementById('totalCount');
const totalValue   = document.getElementById('totalValue');

// ── Динамічна валідація під час введення ───────────
[productName, description, price, quantity, sku].forEach(field => {
  field.addEventListener('input', () => {
    validateField(field);
    updateSubmitButton();
  });
});

category.addEventListener('change', () => {
  validateField(category);
  updateSubmitButton();
});

// ── Перевірка окремого поля ─────────────────────────
function validateField(field) {
  field.classList.remove('is-valid', 'is-invalid');

  if (field.id === 'productName') {
    const ok = field.value.trim().length >= 2;
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  if (field.id === 'category') {
    const ok = field.value !== '';
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  if (field.id === 'price') {
    const val = parseFloat(field.value);
    const ok  = !isNaN(val) && val > 0;
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  if (field.id === 'quantity') {
    const val = parseInt(field.value);
    const ok  = !isNaN(val) && val >= 1;
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  if (field.id === 'sku') {
    // Необов'язкове поле — валідуємо лише якщо заповнено
    if (field.value.trim() === '') {
      field.classList.remove('is-invalid', 'is-valid');
      return true;
    }
    const pattern = /^[A-Za-z0-9\-]{3,20}$/;
    const ok = pattern.test(field.value.trim());
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  if (field.id === 'description') {
    const ok = field.value.trim().length >= 10;
    field.classList.add(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  return true;
}

// ── Активація кнопки "Додати товар" ─────────────────
function updateSubmitButton() {
  const requiredFields = [productName, category, price, quantity, description];
  const allValid = requiredFields.every(f => validateField(f));
  submitBtn.disabled = !allValid;
}

// Початкова перевірка
updateSubmitButton();

// ── Обробка надсилання форми ────────────────────────
form.addEventListener('submit', function(e) {
  e.preventDefault();

  const errors = collectErrors();

  if (errors.length > 0) {
    showErrorSummary(errors);
    return;
  }

  hideErrorSummary();
  addProductToTable();
  showSuccess();
  form.reset();
  clearValidationClasses();
  updateSubmitButton();
});

// ── Збір помилок ────────────────────────────────────
function collectErrors() {
  const errors = [];

  if (productName.value.trim().length < 2)
    errors.push('Назва товару має містити мінімум 2 символи.');

  if (category.value === '')
    errors.push('Оберіть категорію товару.');

  if (isNaN(parseFloat(price.value)) || parseFloat(price.value) <= 0)
    errors.push('Ціна повинна бути числом більше 0.');

  if (isNaN(parseInt(quantity.value)) || parseInt(quantity.value) < 1)
    errors.push('Кількість має бути цілим числом (мінімум 1).');

  if (description.value.trim().length < 10)
    errors.push('Опис товару має містити мінімум 10 символів.');

  if (sku.value.trim() !== '' && !/^[A-Za-z0-9\-]{3,20}$/.test(sku.value.trim()))
    errors.push('Артикул: 3–20 символів, лише латинські літери, цифри та дефіс.');

  return errors;
}

// ── Відображення помилок ────────────────────────────
function showErrorSummary(errors) {
  errorSummary.style.display = 'block';
  errorSummary.innerHTML = '<strong>⚠️ Виявлено помилки:</strong><ul class="mb-0 mt-1">'
    + errors.map(e => `<li>${e}</li>`).join('')
    + '</ul>';
}

function hideErrorSummary() {
  errorSummary.style.display = 'none';
  errorSummary.innerHTML = '';
}

// ── Показ повідомлення про успіх ────────────────────
function showSuccess() {
  successAlert.style.display = 'block';
  // Прокрутка до верху
  successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    successAlert.style.display = 'none';
  }, 4000);
}

// ── Додавання товару в таблицю ──────────────────────
function addProductToTable() {
  const product = {
    id:          idCounter++,
    name:        productName.value.trim(),
    category:    category.value,
    price:       parseFloat(price.value).toFixed(2),
    quantity:    parseInt(quantity.value),
    sku:         sku.value.trim() || '—',
    brand:       brand.value.trim() || '—',
    inStock:     inStock.checked,
    description: description.value.trim()
  };

  products.push(product);

  // Прибрати рядок "порожньо"
  if (emptyRow) emptyRow.style.display = 'none';

  // Створення рядка таблиці
  const tr = document.createElement('tr');
  tr.id = `row-${product.id}`;
  tr.innerHTML = `
    <td><span class="badge bg-secondary">${product.id}</span></td>
    <td>
      <strong>${escapeHtml(product.name)}</strong><br>
      <small class="text-muted">${escapeHtml(product.description.substring(0, 50))}${product.description.length > 50 ? '...' : ''}</small>
    </td>
    <td><span class="badge badge-category bg-info text-dark">${escapeHtml(product.category)}</span></td>
    <td class="text-end fw-bold">${product.price} ₴</td>
    <td class="text-center">${product.quantity}</td>
    <td><code>${escapeHtml(product.sku)}</code></td>
    <td>${escapeHtml(product.brand)}</td>
    <td class="text-center">
      ${product.inStock
        ? '<span class="badge bg-success">✔ Так</span>'
        : '<span class="badge bg-danger">✘ Ні</span>'}
    </td>
    <td class="text-center">
      <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})" title="Видалити">🗑</button>
    </td>
  `;
  tableBody.appendChild(tr);

  updateStats();

  // Підсвітка нового рядка
  tr.style.backgroundColor = '#d1e7dd';
  setTimeout(() => tr.style.backgroundColor = '', 1500);
}

// ── Видалення товару ────────────────────────────────
function deleteProduct(id) {
  if (!confirm('Видалити цей товар?')) return;

  products = products.filter(p => p.id !== id);
  const row = document.getElementById(`row-${id}`);
  if (row) row.remove();

  if (products.length === 0 && emptyRow) {
    emptyRow.style.display = '';
  }

  updateStats();
}

// ── Оновлення статистики ────────────────────────────
function updateStats() {
  totalCount.textContent = products.length;
  const total = products.reduce((sum, p) => sum + parseFloat(p.price) * p.quantity, 0);
  totalValue.textContent = total.toFixed(2) + ' грн';
}

// ── Очищення класів валідації після reset ───────────
resetBtn.addEventListener('click', () => {
  clearValidationClasses();
  hideErrorSummary();
  updateSubmitButton();
});

function clearValidationClasses() {
  form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
    el.classList.remove('is-valid', 'is-invalid');
  });
}

// ── Захист від XSS ──────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
