const EditIcon = '<svg focusable = "false" fill = "#f0f0f0" width="20px" height="20px" aria-hidden="true" viewBox = "0 0 24 24"  aria - label="fontSize small" > <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg >'
const DeleteIcon = `<svg focusable="false" fill = "#f0f0f0" width="20px" height="20px" aria-hidden="true" viewBox="0 0 24 24" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`
const ArrowLeftIcon = `<svg focusable = "false" fill = "#f0f0f0" width="20px" height="20px" aria-hidden="true" viewBox = "0 0 24 24" aria - label="fontSize small" > <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg >`
const ArrowRightIcon = `<svg focusable = "false" fill = "#f0f0f0" width="20px" height="20px" aria-hidden="true" viewBox = "0 0 24 24" data - testid="ArrowForwardIcon" aria - label="fontSize small" > <path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg >`

const myFetch = (url, options = {}) => {
    const { method = 'GET', headers = {}, body } = options;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(method, url);

        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key])
        })

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText)
            } else {
                reject(new Error(xhr.statusText))
            }
        }

        xhr.onerror = () => {
            reject(new Error('Network Error'))
        }

        xhr.send(body)
    })
}

const API = (function () {
    const URL = "http://localhost:3000";

    const api = function (url, { method = 'GET', body = null }) {
        let _method = method.toUpperCase();
        return myFetch(URL + url, {
            method: _method,
            headers: {
                "Content-Type": "application/json"
            },
            body: (_method === 'GET' || _method === 'DELETE')
                ? null : JSON.stringify(body)
        })
            .then(res => {
                // if(!res.ok) {
                //     throw Error('Something went wrong')
                // }

                return JSON.parse(res)
            })
    }

    const getTodos = () => api('/todos', {
        method: 'get'
    })

    const addTodo = (newTodo) => api('/todos', {
        method: 'post',
        body: newTodo
    })

    const editTodo = (id, newTodo) => api('/todos/' + id, {
        method: 'patch',
        body: newTodo
    })

    const changeTodoStatus = (id, newTodo) => api('/todos/' + id, {
        method: 'patch',
        body: newTodo
    })

    const deleteTodo = (id) => api('/todos/' + id, {
        method: 'delete',
    })

    return {
        getTodos,
        addTodo,
        editTodo,
        deleteTodo,
        changeTodoStatus
    }
})();

const Model = (function () {
    class State {
        #onChange;
        #todos;

        constructor() {
            this.#todos = [];
        };

        get todos() {
            return this.#todos;
        };

        set todos(todos) {
            this.#todos = todos
            this.#onChange?.()
        }

        subscribe(callback) {
            this.#onChange = callback
        }
    }

    const { getTodos, addTodo, editTodo, deleteTodo, changeTodoStatus } = API

    return {
        State,
        getTodos,
        addTodo,
        editTodo,
        deleteTodo,
        changeTodoStatus
    }
})();

const View = (function () {
    // const
    const formEl = document.querySelector(".form");
    const mainEl = document.querySelector('.main');
    const todoListEl = document.querySelector(".incomplete");
    const todoListCompeleteEl = document.querySelector(".complete");
    const inputEl = document.querySelector('#input')

    const updateTodos = (todos) => {
        let tempIncomp = '';
        let tempComp = '';

        todos.forEach(todo => {
            let tempOne = `
            <li>
                <span>${todo.name}</span>
                <input type="text" class="edit-input"/>
                <button class="btn-delete" id="${todo.id}">${DeleteIcon}</button>
                <button class="btn-edit" data-id="${todo.id}">${EditIcon}</button>
                <button class="btn-change" data-id="${todo.id}">${ArrowRightIcon}</button>
            </li>
            `;

            let tempTwo = `
            <li>
                <button class="btn-change" data-id="${todo.id}">${ArrowLeftIcon}</button>
                <span>${todo.name}</span>
                <input type="text" class="edit-input"/>
                <button class="btn-delete" id="${todo.id}">${DeleteIcon}</button>
                <button class="btn-edit" data-id="${todo.id}">${EditIcon}</button>
            </li>
            `;

            !todo.isCompleted ? tempIncomp += tempOne : tempComp += tempTwo;
        })

        if (todos.length === 0) {
            template = '<span>Nothing</span>'
        };
        todoListEl.innerHTML = tempIncomp;
        todoListCompeleteEl.innerHTML = tempComp;
    }

    return {
        formEl,
        inputEl,
        todoListEl,
        mainEl,
        updateTodos
    }
})()

const ViewModel = (function (View, Model) {
    const state = new Model.State();
    let currentTodoId;
    let isEditing = false;

    const getTodos = function () {
        Model.getTodos().then(data => {
            state.todos = data.reverse()
        })
    }

    const addTodo = function (event) {
        event.preventDefault();
        const title = View.inputEl.value;

        if (title.trim() === '') {
            alert('Please input title');
            return
        }

        Model.addTodo({ name: title, isCompleted: false }).then(data => {
            state.todos = [data, ...state.todos]
            View.inputEl.value = ''
        })
            .catch(err => {
                alert(err)
            })
    }

    const deleteTodo = (event) => {
        const id = event.target.id

        Model.deleteTodo(id)
            .then(data => {
                let filtered = state.todos.filter(todo => {
                    return todo.id.toString() !== id
                })
                state.todos = filtered
            })
            .catch(err => alert(err))
    }

    const changeTodoStatus = (event) => {
        const id = Number(event.target.dataset.id);

        let target = state.todos.find(todo => {
            return todo.id === id
        })
        target.isCompleted = !target.isCompleted

        Model.changeTodoStatus(id, target)
            .then(() => {
                let temp = [...state.todos]
                state.todos = temp
            })
            .catch(err => alert(err))
    }

    const onEdit = (event) => {
        let todoText = event.target.parentNode.querySelector('span')
        let inputEL = event.target.parentNode.querySelector('input')

        if (!isEditing) {
            currentTodoId = Number(event.target.dataset.id);
            isEditing = true
            todoText.style.display = 'none'
            inputEL.style.display = 'block'
            inputEL.value = todoText.textContent
            inputEL.focus()
        } else {
            if (currentTodoId !== Number(event.target.dataset.id)) {
                return
            }
            isEditing = false
            todoText.style.display = 'block'
            inputEL.style.display = 'none'
            let target = state.todos.find(item => item.id === currentTodoId)
            target.name = inputEL.value
            Model.editTodo(currentTodoId, target)
                .then(() => {
                    let index = state.todos.findIndex(item => item.id === currentTodoId)
                    let temp = [...state.todos]

                    temp[index].name = inputEL.value
                    state.todos = temp
                })
                .catch(err => alert(err))
        }
    }

    const init = () => {
        getTodos()
        View.formEl.addEventListener('submit', addTodo)
        View.mainEl.addEventListener('click', (event) => {
            if (event.target.className === 'btn-delete') {
                deleteTodo(event)
            } else if (event.target.className === 'btn-change') {
                changeTodoStatus(event)
            } else if (event.target.className === 'btn-edit') {
                onEdit(event)
            }
        })
        state.subscribe(() => {
            View.updateTodos(state.todos)
        })
    }

    return { init }
})(View, Model)

ViewModel.init()
