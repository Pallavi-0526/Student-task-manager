const BASE_URL = "https://student-task-manager-maoh.onrender.com";
document.addEventListener("DOMContentLoaded", function() {
    const signupBtn = document.getElementById("signup-btn");

    signupBtn.addEventListener("click", async function() {
        const fullname = document.getElementById("fullname").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const errorMsg = document.getElementById("error-msg");

        if (fullname === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please enter your fullname";
            return;
        } else if (email === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please enter your email";
            return;
        } else if (password === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please enter your password";
            return;
        } else if (confirmPassword === "") {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Please confirm your password";
            return;
        } else if (confirmPassword !== password) {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Passwords do not match";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fullname, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.replace("./index.html");
            } else {
                errorMsg.style.color = "red";
                errorMsg.textContent = data.detail || "Registration failed";
            }

        } catch (error) {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Cannot connect to server. Is it running?";
        }
    });
});
