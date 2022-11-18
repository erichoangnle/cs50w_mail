document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-recipients').focus()
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#read-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h2>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h2><hr>`;

  // Get emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Loop over each email
    emails.forEach(email => {

      // Add HTML elements
      const element = document.createElement('div');
      const from_to = document.createElement('div');
      const subject = document.createElement('div');
      const time = document.createElement('div');

      element.className = 'row';
      from_to.className = 'col-4';
      subject.className = 'col-5';
      time.className = 'col-3';

      // Add style
      time.style.textAlign = 'right';
      element.style.borderRadius = '5px';
      element.style.padding = '3px';
      element.style.margin = '2px';
      
      // Change color if email is read
      if (email['read'] === true) {
        element.style.backgroundColor = "#D3D3D3";
      }

      // Render different line for different mailbox
      if (mailbox == 'sent') {
        from_to.innerHTML = `Sent to: ${email['recipients']}`;
      } else {
        from_to.innerHTML = `From: ${email['sender']}`;
      }

      // Render subject and timestamp
      subject.innerHTML = `${email['subject']}`;
      time.innerHTML = `${email['timestamp']}`;

      // Append info to div
      element.append(from_to);
      element.append(subject);
      element.append(time);

      // Change to read email view on click
      element.addEventListener('click', function() {
        read_email(email['id']);
      })
      
      // Add each email line to DOM
      document.querySelector('#emails-view').append(element);
    })
  })
}

function read_email(id) {

  // Show single email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email').style.display = 'block';

  // Get email from database
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Mark email as read
    fetch(`/emails/${email['id']}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })

    // Clear DOM
    document.querySelector('#read-email').innerHTML = ''

    // Add email info to DOM
    const subject = document.createElement('h3');
    const from = document.createElement('p');
    const body = document.createElement('p');
    subject.innerHTML = `${email['subject']}`;
    from.innerHTML = `From: ${email['sender']} &emsp; Time: ${email['timestamp']}`;
    body.innerHTML = `${email['body'].replace(/\n/g, '<br>')}`;
    document.querySelector('#read-email').append(subject);
    document.querySelector('#read-email').append(from);
    document.querySelector('#read-email').append(body);

    // Add reply buttons
    const reply = document.createElement('button');
    const archive = document.createElement('button');
    reply.className = 'btn btn-primary';
    archive.className = 'btn btn-primary';
    reply.style.marginRight = '5px';
    archive.style.marginLeft = '5px';
    reply.innerHTML = "Reply";
    // Add functionality when button is clicked on
    reply.addEventListener('click', function() {
      // Load compose email view
      compose_email();
      // Pre-populate appropriate fields
      document.querySelector('#compose-recipients').value = `${email['sender']}`;
      document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
      document.querySelector('#compose-body').value = `\n-------------------\n On ${email['timestamp']} ${email['sender']} wrote:\n${email['body']}`;
      document.querySelector('#compose-body').setSelectionRange(0, 0);
      document.querySelector('#compose-body').focus();
    })
    
    
    // Add archive or unarchive button accordingly
    if (email['archived'] == false) {
      archive.innerHTML = "Archive";
      // Add functionality when button is clicked on
      archive.addEventListener('click', function() {
        fetch(`/emails/${email['id']}`, {
          method: 'PUT',
          body: JSON.stringify ({
            archived: true
          })
        })
        .then(email => {
          // Redirect user to archived mailbox
          load_mailbox('archive');
        })     
      })
    } else {
      archive.innerHTML = "Unarchive";
      // Add functionality when button is clicked on
      archive.addEventListener('click', function() {
        fetch(`/emails/${email['id']}`, {
          method: 'PUT',
          body: JSON.stringify ({
            archived: false
          })
        })
        .then(email => {
          // Redirect user to inbox
          load_mailbox('inbox');
        })
        
      })
    }
    document.querySelector('#read-email').append(reply);
    document.querySelector('#read-email').append(archive);
  })
}

function send_email() {

  // Post composed email to API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Redirect user to Sent mailbox
    load_mailbox('sent');
  })

}