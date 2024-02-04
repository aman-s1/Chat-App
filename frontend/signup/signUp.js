const userexists = document.querySelector('#user-exists');

async function signUp(e) {
    try {
        e.preventDefault();

        const signupDetails = {
            name: e.target.username.value,
            email: e.target.email.value,
            phno: e.target.phno.value,
            password: e.target.password.value,
        };

        const response = await axios.post('http://localhost:3000/user/signup', signupDetails);

        if (response.status === 201) {
            alert(response.data.message);
            localStorage.setItem('hasFunctionExecuted','false');
            window.location.href = "../login/login.html";
        } else {
            throw new Error('Failed to sign up');
        }
    } catch (err) {
        console.error(err);

        if (err.response && err.response.data && err.response.data.err === 'User with this email already exists') {
            userexists.style.display = 'block';
        } else {
            userexists.style.display = 'none';

            const errorMessage = document.createElement('div');
            errorMessage.textContent = err.message;
            errorMessage.style.color = 'red';
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '70%';
            errorMessage.style.left = '50%';
            errorMessage.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(errorMessage);
        }
    }
};
