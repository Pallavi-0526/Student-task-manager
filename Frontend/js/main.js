const BASE_URL = "https://student-task-manager-maoh.onrender.com";
document.addEventListener("DOMContentLoaded", function() {
    const loginBtn = document.getElementById("login-btn");

    loginBtn.addEventListener("click", async function() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMsg = document.getElementById("error-msg");

        if (email === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please enter your email";
            return;
        }
        if (password === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please enter your password";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);

                const userResponse = await fetch(`${BASE_URL}/auth/me`, {
                    headers: { "Authorization": `Bearer ${data.access_token}` }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    localStorage.setItem("fullname", userData.fullname);
                }

                errorMsg.style.color = "green";
                errorMsg.textContent = "Login successful! Redirecting...";
                setTimeout(function() {
                    window.location.replace("./dashboard.html");
                }, 1000);

            } else {
                errorMsg.style.color = "red";
                errorMsg.textContent = data.detail || "Login failed";
            }

        } catch (error) {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Cannot connect to server. Is it running?";
        }
    });
});
