const createButton = document.querySelector('button');

createButton.addEventListener('click', (e)=> {
    fetch("/createSession", {method: "POST"}).then((response) => {
        window.location.href=response.headers.get('Location');
    });
})