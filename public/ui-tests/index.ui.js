import UI from '../src/ATON.ui.js'

document.addEventListener('readystatechange', () => {
    // Since UI.createSearch() returns a Promise
    // we need to get its value using the then() method
    // and passing it a callback to manipulate the value.
    UI.createSearch({id:'idScenes', inputId:'sid',listId:'sidlist'})
        .then(el => $('#mainContent').append(el));
});
