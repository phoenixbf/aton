import UI from '../../src/ATON.ui.js'

document.addEventListener('readystatechange', () => {
    // Example: use the createSearch function
    // to create a container with a search input,
    // datalist and button to filter public scenes.
    const options = {
        id:'idScenes', 
        inputId:'sid',
        listId:'sidlist'
    };

    $('#mainContent').append(
        UI.createSearch(options)
    );
});
