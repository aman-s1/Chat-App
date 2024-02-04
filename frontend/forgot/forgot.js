const passheading = document.querySelector('#pass');

async function forgotPass(e) {
    try{
        e.preventDefault();
        console.log(e.target.email.value);

        const recoverDetails = {
            email : e.target.email.value
        }
        console.log(recoverDetails);
        
        const response = await axios.post('http://localhost:3000/password/forgotpassword', recoverDetails);
        if (response.status === 202) {
            console.log(response.data.password);
            if(passheading.innerHTML != '')
            {
                passheading.innerHTML = '';
            }
            passheading.innerHTML += 'Mail Sent Successfully';
        } else {
            throw new Error('Failed to retrieve password');
        }
    } 
    catch (err) {
        if(err.response && err.response.data && err.response.data.err === 'User not found with this email address') 
        {
            if(passheading.innerHTML != '')
            {
                passheading.innerHTML = '';
            }
            passheading.innerHTML += 'User not found with this email address';
        }
        else
        {
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