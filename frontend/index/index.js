const msgList = document.querySelector('#msg');
const oldermsgList = document.querySelector('#oldermsg');
const msgBox = document.querySelector('#messageInput');
const imgBox = document.querySelector('#imageInput');
const errorBox = document.querySelector('#error-box');
const loadOlderChatsBtn = document.getElementById('loadOlderChatsBtn');
const createGroupBtn = document.querySelector('#creategroup');
const groupList = document.querySelector('#groupList');
const addUserbtn = document.getElementById('addUser');
const removeUserbtn = document.getElementById('removeUser');

const socket = io("http://localhost:3000");

const LIMIT = 5;

let currentGroup = null;

loadOlderChatsBtn.addEventListener('click', loadOlderChats);
createGroupBtn.addEventListener('click', createGroupPage);

async function loadUserGroups() {
    try {
        const token = localStorage.getItem('token');
    
        const response = await axios.get('http://localhost:3000/group/getusergroups', { headers: { "Authorization": token } });

        if (response.status === 200) {
            const userGroups = response.data.groups;
            console.log(userGroups);
            // Assuming groupList is an element with the ID "groupList" in your HTML
            const groupList = document.getElementById('groupList');
            groupList.innerHTML = ''; 

            userGroups.forEach(group => {
                const listItem = document.createElement('li');
                listItem.textContent = group.groupname;
                listItem.addEventListener('click', () => {
                    // Handle group name click
                    handleGroupNameClick(group.id, group.groupname);
                });
                groupList.appendChild(listItem);
            });
            socket.emit('loadUserGroups');
        } else {
            throw new Error('Failed to get user groups');
        }
    } catch (err) {
        showError(err);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const socket = io('http://localhost:3000');
    loadUserGroups();
});

async function handleGroupNameClick(groupId, groupName) {
    try {
        currentGroup = { id: groupId, name: groupName };

        const token = localStorage.getItem('token');

        const response = await axios.get(`http://localhost:3000/group/getgroupmessages/${groupId}`, { headers: { "Authorization": token }});
        
        await loadUserList(groupId);
        await checkadmin(groupId);

        if (response.status === 200) {
            const groupMessages = response.data.messages;

            // Display the group name in the messages container
            const messagesContainer = document.getElementById('group-name');
            messagesContainer.innerHTML = `<h3>${groupName}</h3>`;

            // Display the messages
            const parentElement = document.getElementById('msg');
            parentElement.innerHTML = ''; // Clear existing messages
            groupMessages.forEach(msg => {
                addMessageToUI(msg, parentElement);
            });
            loadOlderChatsBtn.style.display = 'block';
        } else {
            throw new Error(`Failed to get group messages. Status: ${response.status}`);
        }
    } catch (err) {
        if(err.response && err.response.data && err.response.data.err === 'No messages found for the group')
        {
            const parentElement = document.getElementById('msg');
            parentElement.innerHTML = '';
        }
        console.error(err);
        showError(err);
    }
}

async function loadUserList(groupId) {
    try {
        const token = localStorage.getItem('token');
        const decodedToken = parseJwt(token);

        const responseUsers = await axios.get(`http://localhost:3000/group/getgroupusers/${groupId}`, { headers: { "Authorization": token }});

        if (responseUsers.status === 200) {
            const groupUsers = responseUsers.data.users;

            // Display the user list in the same line within an h4 tag
            const userListContainer = document.getElementById('user-list');
            userListContainer.innerHTML = `<h4>Users in this group: ${groupUsers.map((user) => {
                return user.name === decodedToken.name ? 'You' : user.name;
            }).join(', ')}</h4>`;
        } else {
            throw new Error(`Failed to get group users. Status: ${responseUsers.status}`);
        }
    } catch (err) {
        showError(err);
    }
}

async function checkadmin(groupId) {
    try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`http://localhost:3000/group/checkadmin/${groupId}`, { headers: { "Authorization": token }});

        if(response.status === 200) {
            addUserbtn.style.display = 'block';
            removeUserbtn.style.display = 'block';
        }
        else {
            addUserbtn.style.display = 'none';
            removeUserbtn.style.display = 'none';
        }
    } catch(err) {
        showError(err);
    }
};

async function addUsertoGroup(e) {
    try {
        e.preventDefault();
        const userName = window.prompt(`Enter the user's name to add to ${currentGroup.name}:`);
        console.log(userName);
        if (userName !== null && userName.trim() !== '') {
            // If a name is provided, make a request to the backend to add the user
            const groupId = currentGroup.id; // Assuming currentGroup is defined
            const token = localStorage.getItem('token');

            const response = await axios.post(`http://localhost:3000/group/adduser/${groupId}`, { userName }, { headers: { "Authorization": token }});

            if (response.status === 200) {
                await loadUserList(currentGroup.id);
                console.log('User added successfully:', response.data);
            } else {
                console.error('Failed to add user:', response.data.error);
            }
        }
    } catch (err) {
        console.error('Error adding user:', err);
        showError(err);
    }
}

async function removeUserfromGroup(e) {
    try {
        e.preventDefault();
        const userName = window.prompt(`Enter the user's name to remove from ${currentGroup.name}:`);
        console.log(userName);
        if (userName !== null && userName.trim() !== '') {
            // If a name is provided, make a request to the backend to add the user
            const groupId = currentGroup.id; // Assuming currentGroup is defined
            const token = localStorage.getItem('token');

            const response = await axios.post(`http://localhost:3000/group/removeuser/${groupId}`, { userName }, { headers: { "Authorization": token }});

            if (response.status === 200) {
                await loadUserList(currentGroup.id);
                console.log('User removed successfully:', response.data);
            } else {
                console.error('Failed to remove user:', response.data.error);
            }
        }
    } catch (err) {
        console.error('Error removing user:', err);
        showError(err);
    }
}
async function loadOlderChats() {
    try {
        const token = localStorage.getItem('token');
        let firstmessageid = getFirstMessageId();
        firstmessageid = firstmessageid === null ? 0 : firstmessageid;

        if (currentGroup) {
            const response = await axios.get(`http://localhost:3000/message/getoldmessage?firstmessageid=${firstmessageid}&groupId=${currentGroup.id}`, { headers: { "Authorization": token } });

            if (response.status === 200) {
                const serverMessages = response.data.messages;
                const parentElement = document.getElementById('oldermsg');
                
                // Clear existing messages in 'oldermsg' list
                parentElement.innerHTML = '';
                console.log(serverMessages);
                serverMessages.forEach((msg) => {
                    addOlderToUI(msg, parentElement);
                });
            } else {
                throw new Error('Failed to get messages');
            }
        } else {
            console.log('No group selected');
        }
    } catch (err) {
        showError(err);
    }
};





function createGroupPage() {
    try{
        window.location.href = "../group/group.html";
    }
    catch (err) {
        console.log(err);
        showError(err);
    }
}

async function userJoindMessage() {
    try {
        const token = localStorage.getItem('token');

        if (!currentGroup) {
            throw new Error('Please select a group before sending a message');
        }

        const msg = {
            message: 'joined the chat',
            groupId: currentGroup.id,
        };

        const response = await axios.post('http://localhost:3000/message/sendmessage', msg, { headers: { "Authorization": token } });

        if (response.status === 201) {
            socket.emit('newMessage', response.data.msg);
            const parentElement = document.getElementById('msg');
            addMessageToUI(response.data.msg,parentElement);
        } else {
            throw new Error('Failed To Join Chat');
        }
    } catch (err) {
        console.log(err);
        showError(err);
    }
}
async function sendmsg(e) {
    try {
        e.preventDefault();

        if (!currentGroup) {
            throw new Error('Please select a group before sending a message');
        }

        const msgVal = msgBox.value;
        const msg = {
            message: `${msgVal}`,
            groupId: currentGroup.id,
        };
        const token = localStorage.getItem('token');
        
        const hasFunctionExecuted = localStorage.getItem('hasFunctionExecuted');

        if (hasFunctionExecuted === 'false') {
            await userJoindMessage();
            localStorage.setItem('hasFunctionExecuted', 'true');
        }
        const response = await axios.post('http://localhost:3000/message/sendmessage', msg, { headers: { "Authorization": token } });

        if (response.status === 201) {
            socket.emit('newMessage', response.data.msg);
            const parentElement = document.getElementById('msg');
            addMessageToUI(response.data.msg,parentElement);
            msgBox.value = '';
        } else {
            throw new Error('Failed To send Message');
        }
    } catch (err) {
        if (err.response && err.response.data && err.response.data.err === 'No message to send') {
            errorBox.innerHTML = '';
            errorBox.innerHTML += 'No message to send';
        } else {
            showError(err);
        }
        console.log(err);
    }
};

function getCurrentGroupId() {
    return currentGroup.id;
}

async function sendimg(e) {
    try {
        e.preventDefault();

        if (!currentGroup) {
            throw new Error('Please select a group before sending an image');
        }

        const imageInput = document.getElementById('imageInput');
        const imageFile = imageInput.files[0];

        if (!imageFile) {
            throw new Error('Please select an image file');
        }
        const groupId = getCurrentGroupId();
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('image', imageFile);
        console.log([...formData.entries()]);

        const response = await axios.post('http://localhost:3000/message/sendimage', formData, {
            headers: {
                'Authorization': localStorage.getItem('token'),
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log(response.data.message);
        socket.emit('newImage', response.data.message);
        const parentElement = document.getElementById('msg');
        addImageToUI(response.data.message, parentElement);
    } catch(err) {
        showError(err);
    }
}

function getFirstMessageId() {
    const localMessages = JSON.parse(localStorage.getItem('storedmsg')) || [];
    return localMessages.length > 0 ? localMessages[0].id : null;
}

function getLastMessageId() {
    const localMessages = JSON.parse(localStorage.getItem('storedmsg')) || [];
    return localMessages.length > 0 ? localMessages[localMessages.length - 1].id : null;
}


function fetchAndDisplayMessages() {
    try {
        const token = localStorage.getItem('token');
        let lastmessageid = getLastMessageId();
        lastmessageid === null ? -1 : lastmessageid;

        if (currentGroup) {
            // Get messages from local storage for the selected group
            const groupMessages = getGroupMessagesFromLocalStorage(currentGroup.id);

            // Display the messages
            const parentElement = document.getElementById('msg');
            console.log(groupMessages);
            parentElement.innerHTML = '';
            groupMessages.forEach(msg => {
                addMessageToUI(msg, parentElement);
            });
        } else {
            console.log('No group selected');
        }
    } catch (err) {
        showError(err);
    }
}

// Function to retrieve messages for a specific group from local storage
function getGroupMessagesFromLocalStorage(groupId) {
    const allMessages = JSON.parse(localStorage.getItem('storedmsg')) || [];
    return allMessages.filter(msg => msg.groupId === groupId);
}



fetchAndDisplayMessages();

setInterval(fetchAndDisplayMessages, 2000);


function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

async function addImageToUI(msg, parentElement) {
    const msgElemId = `msg-${msg.id}`;

    const listItem = document.createElement('li');
    listItem.id = msgElemId;
    listItem.style.padding = '5px';

    const imageUrl = msg.image;
    listItem.innerHTML = `<img src="${imageUrl}" alt="Image" style="max-width: 100%;">`;

    parentElement.appendChild(listItem);
}

async function addOlderToUI(msg, parentElement) {

    const msgElemId = `msg-${msg.id}`;
    const token = localStorage.getItem('token');
    const decodedToken = parseJwt(token);
    const senderName = msg.userName == decodedToken.name ? 'You' : msg.userName;
    
    // Create a new list item element
    const listItem = document.createElement('li');
    listItem.id = msgElemId;
    listItem.style.padding = '5px';

    let messageContent = msg.message;
    if (messageContent === 'joined the chat') {
        listItem.innerHTML = `<em>${msg.userName} joined the chat</em>`;
    } else {
        listItem.innerHTML = `<strong>${senderName}:</strong> ${msg.message}`;
    }

    parentElement.appendChild(listItem);
}

async function addMessageToUI(msg, parentElement) {

    const msgElemId = `msg-${msg.id}`;
    
    let storedmsg = JSON.parse(localStorage.getItem('storedmsg')) || [];
    const messageWithGroup = { ...msg, groupId: currentGroup.id, groupName: currentGroup.name };

    // Push the new message to the array
    storedmsg.push(messageWithGroup);

    if (storedmsg.length > LIMIT) {
        storedmsg = storedmsg.slice(storedmsg.length - LIMIT);
    }
    // Save the updated array back to localStorage
    localStorage.setItem('storedmsg', JSON.stringify(storedmsg));

    const token = localStorage.getItem('token');
    const decodedToken = parseJwt(token);
    const senderName = msg.sender == decodedToken.name ? 'You' : msg.user.name;
    
    // Create a new list item element
    const listItem = document.createElement('li');
    listItem.id = msgElemId;
    listItem.style.padding = '5px';

    let messageContent = msg.message;
    if (messageContent === 'joined the chat') {
        listItem.innerHTML = `<em>${msg.sender} joined the chat</em>`;
    } else {
        listItem.innerHTML = `<strong>${senderName}:</strong> ${msg.message}`;
    }

    // Append the new list item to the parent element
    parentElement.appendChild(listItem);
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
};