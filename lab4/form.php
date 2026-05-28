<?php
// Отримання даних методом POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Очищення даних для безпеки
    $name = htmlspecialchars($_POST['p_name']);
    $price = htmlspecialchars($_POST['p_price']);
    $category = htmlspecialchars($_POST['p_category']);
    $description = htmlspecialchars($_POST['p_desc']);

    // Валідація на стороні сервера
    if (empty($name) || empty($price) || empty($category)) {
        echo "<h3>Помилка: Всі обов'язкові поля мають бути заповнені!</h3>";
        echo "<a href='index.html'>Назад до форми</a>";
        exit;
    }

    // Імітація успішного додавання в базу даних
    echo "<h2>Товар успішно додано!</h2>";
    echo "<p><strong>Назва:</strong> $name</p>";
    echo "<p><strong>Ціна:</strong> $price грн.</p>";
    echo "<p><strong>Категорія:</strong> $category</p>";
    echo "<p><strong>Опис:</strong> $description</p>";
    echo "<br><a href='index.html'>Додати ще один товар</a>";
} else {
    header("Location: index.html");
}
?>