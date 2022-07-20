import Experience from './experience';

const init = () => {
    new Experience({
        dom: document.getElementById('container')
    });
};

if (document.readyState === 'complete') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}