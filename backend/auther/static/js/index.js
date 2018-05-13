const origin = window.location.origin;

function makeUserCard(user) {
  const username = user['username'];

  const edit = $('<textarea class="edit"/>');
  edit.val(JSON.stringify(user, null, 2));

  const deleteButton = $('<button class="delete">Delete</button>');
  deleteButton.click(() => doDeleteUser(username));

  const updateButton = $('<button class="update">Update</button>');

  const buttonGroup = $('<div class="buttons"/>');
  buttonGroup.append(deleteButton);
  buttonGroup.append(updateButton);

  const root = $('<div class="user"/>');
  root.append(edit);
  root.append(buttonGroup);

  return root;
}

function updateUsers() {
  $.get(origin + '/user', res => {
    const users = JSON.parse(res).users;
    users.sort((u1, u2) => u1['ctime'] < u2['ctime']) ? -1 : 0;
    $('#users').empty().append(users.map(makeUserCard));
  });
}

function doSignup(username, password) {
  $.ajax({
    method: 'POST',
    url: origin + '/user', 
    data: JSON.stringify({
      'username': username,
      'password': password,
    }),
    contentType: 'application/json',
    success: updateUsers,
    error: function(err) {
      if (err.status == 409) {
        alert('Username already taken');
      }
    }
  });
}

function doLogin(username, password) {
  $.ajax({
    method: 'POST',
    url: origin + '/get-token', 
    data: JSON.stringify({
      'username': username,
      'password': password,
    }),
    contentType: 'application/json',
    success: res => {
      console.log(res);
    },
    error: function(err) {
      console.log(err);
    }
  });
}

function check_login_and_call(func) {
  const username = $('#username').val();
  const password = $('#password').val();
  if (!username) {
    alert("Username empty");
    return;
  }
  if (!password) {
    alert("Password empty");
    return;
  }
  return func(username, password);
}

function doDeleteUser(username) {
  $.ajax({
    method: 'DELETE',
    url: origin + '/user/' + username,
    success: updateUsers
  });
}

$(() => {
  updateUsers();

  $('#signup').click(() => check_login_and_call(doSignup));
  $('#login').click(() => check_login_and_call(doLogin));
});
