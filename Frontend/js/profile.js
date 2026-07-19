const BASE_URL = "https://student-task-manager-maoh.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
    window.location.replace("./index.html");
}

async function loadProfile() {
    try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById("profile-name").textContent = user.fullname;
            document.getElementById("profile-email").textContent = user.email;
            document.getElementById("new-name").value = user.fullname;

            // show profile picture if exists
            if (user.profile_picture) {
                document.getElementById("profile-pic-preview").src = user.profile_picture;
            }
        } else if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.replace("./index.html");
        }
    } catch (error) {
        console.log("Error loading profile:", error);
    }
}

loadProfile();

// update name
document.getElementById("update-name-btn").addEventListener("click", async function() {
    const newName = document.getElementById("new-name").value;
    const nameMsg = document.getElementById("name-msg");

    if (newName === "") {
        nameMsg.style.color = "red";
        nameMsg.textContent = "Please enter a name";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/update-name`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ fullname: newName })
        });

        if (response.ok) {
            nameMsg.style.color = "green";
            nameMsg.textContent = "Name updated successfully!";
            localStorage.setItem("fullname", newName);
            document.getElementById("profile-name").textContent = newName;
        } else {
            nameMsg.style.color = "red";
            nameMsg.textContent = "Could not update name";
        }
    } catch (error) {
        nameMsg.style.color = "red";
        nameMsg.textContent = "Cannot connect to server";
    }
});

// preview image when selected
document.getElementById("profile-pic-input").addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("profile-pic-preview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// upload picture
document.getElementById("upload-pic-btn").addEventListener("click", async function() {
    const file = document.getElementById("profile-pic-input").files[0];
    const picMsg = document.getElementById("pic-msg");

    if (!file) {
        picMsg.style.color = "red";
        picMsg.textContent = "Please select an image first";
        return;
    }

    // convert image to base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;

        try {
            const response = await fetch(`${BASE_URL}/auth/update-picture`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ profile_picture: base64Image })
            });

            if (response.ok) {
                picMsg.style.color = "green";
                picMsg.textContent = "Profile picture updated!";
                // Update nav avatar live without relying on localStorage
                const navAvatar = document.getElementById("nav-avatar");
                if (navAvatar) navAvatar.src = base64Image;
            } else {
                picMsg.style.color = "red";
                picMsg.textContent = "Could not update picture";
            }
        } catch (error) {
            picMsg.style.color = "red";
            picMsg.textContent = "Cannot connect to server";
        }
    };
    reader.readAsDataURL(file);
});

// change password
document.getElementById("change-password-btn").addEventListener("click", async function() {
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmNewPassword = document.getElementById("confirm-new-password").value;
    const passwordMsg = document.getElementById("password-msg");

    if (currentPassword === "") {
        passwordMsg.style.color = "red";
        passwordMsg.textContent = "Please enter current password";
        return;
    } else if (newPassword === "") {
        passwordMsg.style.color = "red";
        passwordMsg.textContent = "Please enter new password";
        return;
    } else if (confirmNewPassword === "") {
        passwordMsg.style.color = "red";
        passwordMsg.textContent = "Please confirm new password";
        return;
    } else if (newPassword !== confirmNewPassword) {
        passwordMsg.style.color = "red";
        passwordMsg.textContent = "New passwords do not match";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        if (response.ok) {
            passwordMsg.style.color = "green";
            passwordMsg.textContent = "Password changed successfully!";
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-new-password").value = "";
        } else {
            const data = await response.json();
            passwordMsg.style.color = "red";
            passwordMsg.textContent = data.detail || "Could not change password";
        }
    } catch (error) {
        passwordMsg.style.color = "red";
        passwordMsg.textContent = "Cannot connect to server";
    }
});
