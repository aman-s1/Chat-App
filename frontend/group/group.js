document.addEventListener('DOMContentLoaded', function() {
    const participantsList = document.querySelector('#participantslist');
    const errorBox = document.querySelector('#error-box');

    document.getElementById('addMoreParticipants').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'participantName';
        input.placeholder = 'Participant Name';
        participantsList.appendChild(input);
    });

    async function createGroup(e) {
        try {
            e.preventDefault();
            const groupName = document.getElementById('groupName').value;
            const participantInputs = document.querySelectorAll('input[name="participantName"]');
            const participantNames = Array.from(participantInputs).map(input => input.value);

            // TODO: Send the group name and participant names to the backend using axios
            console.log('Group Name:', groupName);
            console.log('Participant Names:', participantNames);

            const token = localStorage.getItem('token'); // Assuming you have a token stored in localStorage

            const data = {
                groupName: groupName,
                participants: participantNames
            };

            const response = await axios.post('http://localhost:3000/group/create', data, { headers: { "Authorization": token } });

            if(response.status === 200)
            {
                window.location.href = "../index/index.html";
                alert(`${groupName} created Successfully`);
            }
            else
            {
                throw new Error('Unable To create Group');
            }
        } catch(err) {
            showError(err);
        }
    }

    function showError(err) {
        console.error(err);

        if (errorBox.innerHTML !== '') {
            errorBox.innerHTML = '';
        }

        if (err.response && err.response.data && err.response.data.err) {
            errorBox.innerHTML += err.response.data.err;
        } else if (err.message) {
            errorBox.innerHTML += err.message;
        } else {
            errorBox.innerHTML += 'An error occurred.';
        }
    }

    document.getElementById('createGroup').addEventListener('click', createGroup);
});