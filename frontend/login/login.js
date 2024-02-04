const invCred = document.querySelector('#inc-cred');
const noAuth = document.querySelector('#no-auth');

async function login(e) {
    try {
        e.preventDefault();
        console.log(e.target.email.value, e.target.password.value);

        const loginDetails = {
            email: e.target.email.value,
            password: e.target.password.value
        };

        const response = await axios.post('http://localhost:3000/user/login', loginDetails);

        if (response.status === 200) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('hasFunctionExecuted','false');
            localStorage.setItem('storedmsg', JSON.stringify([]));
            window.location.href = "../index/index.html";
            alert(response.data.message);
        }else {
            throw new Error('Failed to login');
        }
    } catch (err) {
        if(err.response && err.response.data && err.response.data.err === 'User does not exist')
        {
            if(noAuth.style.display == 'block')
            {
                noAuth.style.display = 'none';
            }
            invCred.style.display = 'block';
        }
        else if(err.response && err.response.data && err.response.data.err === 'User not authorized')
        {
            if(invCred.style.display == 'block')
            {
                invCred.style.display = 'none';
            }
            noAuth.style.display = 'block';
        }
        else {
            if(invCred.style.display == 'block')
            {
                invCred.style.display = 'none';
            }
            const errorMessage = document.createElement('div');
            errorMessage.textContent = err.message;
            errorMessage.style.color = 'red';
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '70%';
            errorMessage.style.left = '50%';
            errorMessage.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(errorMessage);
        }
        console.error(err.message);
    }
};