// todo.js

function getTodoListFromCookie() {
    var cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('todoList='))
      ?.split('=')[1];
  
    return cookieValue ? JSON.parse(decodeURIComponent(cookieValue)) : [];
  }
  
  function setTodoListCookie(todoList) {
    document.cookie = `todoList=${encodeURIComponent(JSON.stringify(todoList))}`;
  }
  
  var todoList = getTodoListFromCookie();
  
  function todo(action, task) {
    var term = this;
  
    switch (action) {
      case 'add':
        if (task) {
          todoList.push(task);
          setTodoListCookie(todoList);
          term.echo(`Task "${task}" added to the todo list.`);
        } else {
          term.error('Usage: todo add <task>');
        }
        break;
  
      case 'remove':
        if (task) {
          var index = todoList.indexOf(task);
          if (index !== -1) {
            todoList.splice(index, 1);
            setTodoListCookie(todoList);
            term.echo(`Task "${task}" removed from the todo list.`);
          } else {
            term.error(`Task "${task}" not found in the todo list.`);
          }
        } else {
          term.error('Usage: todo remove <task>');
        }
        break;
  
      case 'list':
        if (todoList.length > 0) {
          term.echo('Todo List:');
          todoList.forEach((item, index) => term.echo(`${index + 1}. ${item}`));
        } else {
          term.echo('The todo list is empty.');
        }
        break;
  
      default:
        term.error('Usage: todo <add/remove/list>');
        break;
    }
  }
