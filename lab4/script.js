$(document).ready(function() {
    $('#productForm').on('submit', function(e) {
        let errors = [];
        let name = $('#p_name').val().trim();
        let price = $('#p_price').val();
        let category = $('#p_category').val();

        // Перевірка обов'язкових полів
        if (name.length < 3) {
            errors.push("Назва товару має бути не менше 3 символів.");
        }
        if (price <= 0 || price === "") {
            errors.push("Вкажіть коректну ціну (більше 0).");
        }
        if (category === "") {
            errors.push("Оберіть категорію товару.");
        }

        if (errors.length > 0) {
            e.preventDefault(); // Зупинка відправки форми
            $('#js-errors').html(errors.join('<br>'));
        }
    });
});