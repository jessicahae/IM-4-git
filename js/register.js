console.log("register.js ist verbunden");


document.getElementById("registerForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();
        console.log("submit");

        const email = document.getElementById("email").
            value.trim();

        const password = document.getElementById
            ("password").value.trim();

        console.log(email + " " + password);

        try {
            const response = await fetch("/api/register.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
        } catch (error) { }
    });