/**
 * Лабораторна робота №7 — Варіант 16
 * Захист форми: блокування ";" та "--" (JS) + XSS-захист
 */

$(document).ready(function () {

  // ── Небезпечні патерни (SQL ін'єкція) ─────────────────
  const BLOCKED_PATTERNS = [
    { pattern: /;/g,   label: 'крапка з комою ";"' },
    { pattern: /--/g,  label: 'подвійний дефіс "--"' },
  ];

  // ── Додаткові XSS-патерни (блокуємо теги та JS-події) ──
  const XSS_PATTERNS = [
    { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, label: '<script> тег' },
    { pattern: /<[^>]+on\w+\s*=/gi,                    label: 'JS-подія у тезі (onclick тощо)' },
    { pattern: /javascript\s*:/gi,                     label: 'javascript: протокол' },
  ];

  const fields       = ['#senderName', '#senderEmail', '#subject', '#messageText'];
  const submitBtn    = $('#submitBtn');
  const blockedAlert = $('#blockedAlert');
  const blockedReason= $('#blockedReason');
  const errorSummary = $('#errorSummary');
  const charCounter  = $('#charCounter');

  // ── Лічильник символів textarea ────────────────────────
  $('#messageText').on('input', function () {
    const len = $(this).val().length;
    charCounter.text(`${len} / 2000`);
    charCounter.toggleClass('danger', len > 1800);
  });

  // ── Перевірка небезпечних символів у полі ──────────────
  function checkDangerousInput(value) {
    const found = [];

    BLOCKED_PATTERNS.forEach(({ pattern, label }) => {
      if (pattern.test(value)) found.push(label);
      pattern.lastIndex = 0;
    });

    XSS_PATTERNS.forEach(({ pattern, label }) => {
      if (pattern.test(value)) found.push(label);
      pattern.lastIndex = 0;
    });

    return found;
  }

  // ── Очищення небезпечних символів (реал-тайм блокування) ─
  function sanitizeInput(value) {
    return value
      .replace(/;/g, '')           // блокуємо ";"
      .replace(/--/g, '')          // блокуємо "--"
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  // ── Обробник введення для кожного поля ─────────────────
  fields.forEach(selector => {
    const $field = $(selector);

    $field.on('input', function () {
      const original = $(this).val();
      const found    = checkDangerousInput(original);

      if (found.length > 0) {
        // Видаляємо небезпечні символи та попереджаємо
        $(this).val(sanitizeInput(original));
        showBlockedAlert(found);
      } else {
        hideBlockedAlert();
      }

      validateField($(this));
      updateSubmitState();
    });

    $field.on('blur', function () {
      validateField($(this));
    });
  });

  // ── Показати попередження про блокування ───────────────
  function showBlockedAlert(found) {
    const list = found.join(', ');
    blockedReason.text(` Виявлено та видалено: ${list}.`);
    blockedAlert.slideDown(200);
    setTimeout(() => blockedAlert.slideUp(400), 4000);
  }

  function hideBlockedAlert() {
    blockedAlert.hide();
  }

  // ── Валідація окремого поля ────────────────────────────
  function validateField($field) {
    $field.removeClass('is-valid is-invalid');
    let ok = true;

    const val = $field.val().trim();
    const id  = $field.attr('id');

    if (id === 'senderName')  ok = val.length >= 2;
    if (id === 'senderEmail') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (id === 'subject')     ok = val.length >= 3;
    if (id === 'messageText') ok = val.length >= 10;

    $field.addClass(ok ? 'is-valid' : 'is-invalid');
    return ok;
  }

  // ── Активація кнопки Submit ────────────────────────────
  function updateSubmitState() {
    const allOk = fields.every(sel => {
      const val = $(sel).val().trim();
      const id  = $(sel).attr('id');
      if (id === 'senderName')  return val.length >= 2;
      if (id === 'senderEmail') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (id === 'subject')     return val.length >= 3;
      if (id === 'messageText') return val.length >= 10;
      return true;
    });
    submitBtn.prop('disabled', !allOk);
  }

  // ── Відправка форми через AJAX ─────────────────────────
  $('#messageForm').on('submit', function (e) {
    e.preventDefault();

    // Фінальна перевірка всіх полів
    const errors = [];
    fields.forEach(sel => {
      if (!validateField($(sel))) {
        errors.push($(sel).prev('label').text().replace('*', '').trim());
      }
    });

    if (errors.length > 0) {
      errorSummary.html(
        '<strong>⚠️ Виправте помилки у полях:</strong><ul class="mb-0 mt-1">'
        + errors.map(e => `<li>${e}</li>`).join('')
        + '</ul>'
      ).show();
      return;
    }

    errorSummary.hide();

    const payload = {
      sender_name:  $('#senderName').val().trim(),
      sender_email: $('#senderEmail').val().trim(),
      subject:      $('#subject').val().trim(),
      message:      $('#messageText').val().trim(),
      priority:     $('#priority').val()
    };

    submitBtn.prop('disabled', true).html('⏳ Надсилання...');

    $.ajax({
      url:         '/api/messages',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify(payload),
      success: function (res) {
        $('#successAlert').show();
        setTimeout(() => $('#successAlert').fadeOut(), 5000);
        $('#messageForm')[0].reset();
        clearValidation();
        charCounter.text('0 / 2000');
        updateSubmitState();
        loadMessages();
      },
      error: function (xhr) {
        const resp = xhr.responseJSON;
        const msg  = resp && resp.errors
          ? resp.errors.join('<br>')
          : 'Помилка сервера. Спробуйте ще раз.';
        errorSummary.html('<strong>❌ Помилка:</strong> ' + msg).show();
      },
      complete: function () {
        submitBtn.prop('disabled', false).html('📨 Надіслати повідомлення');
        updateSubmitState();
      }
    });
  });

  // ── Очищення після reset ───────────────────────────────
  $('#resetBtn').on('click', function () {
    setTimeout(() => {
      clearValidation();
      errorSummary.hide();
      hideBlockedAlert();
      charCounter.text('0 / 2000').removeClass('danger');
      updateSubmitState();
    }, 10);
  });

  function clearValidation() {
    fields.forEach(sel => $(sel).removeClass('is-valid is-invalid'));
  }

  // ── Завантаження повідомлень з сервера ─────────────────
  function loadMessages() {
    $.get('/api/messages', function (res) {
      const list = $('#messagesList');
      list.empty();

      if (!res.messages || res.messages.length === 0) {
        list.html('<p class="text-muted text-center py-3">Повідомлень ще немає</p>');
        return;
      }

      res.messages.forEach(function (msg) {
        const priorityMap = {
          low:    '🟢 Низький',
          normal: '🟡 Звичайний',
          high:   '🔴 Високий'
        };

        // Безпечне відображення — textContent через jQuery .text()
        const $item = $('<div class="message-item">');

        const $header = $('<div class="d-flex justify-content-between align-items-start mb-1">');
        const $title  = $('<strong>').text(msg.subject);
        const $badge  = $('<span class="badge bg-secondary ms-2">').text(priorityMap[msg.priority] || msg.priority);
        const $del    = $('<button class="btn btn-sm btn-outline-danger ms-auto py-0">')
                          .text('🗑')
                          .attr('title', 'Видалити')
                          .on('click', function () { deleteMessage(msg.id); });

        $header.append($title, $badge, $del);

        const $meta = $('<div class="msg-meta mt-1">');
        $('<span>').text(`від: ${msg.sender_name} <${msg.sender_email}>`).appendTo($meta);
        $('<span class="ms-3">').text(`🕐 ${msg.created_at}`).appendTo($meta);

        const $text = $('<p class="mb-0 mt-2">').text(msg.message);

        $item.append($header, $meta, $text);
        list.append($item);
      });
    });
  }

  // ── Видалення повідомлення ─────────────────────────────
  function deleteMessage(id) {
    if (!confirm('Видалити це повідомлення?')) return;
    $.ajax({
      url:    `/api/messages/${id}`,
      method: 'DELETE',
      success: loadMessages
    });
  }

  // Завантажити повідомлення при старті
  loadMessages();

});
