import './scss/style.scss';
import config from './db_config.js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  FieldValue,
  DocumentSnapshot,
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';

const app = initializeApp(config);

const db = getFirestore(app);

/**
 * sends the message to the database
 * @param {object} message the message to send
 */
async function sendMessage(message) {
  const docRef = await addDoc(collection(db, 'messages'), message);
  console.log('Document written with ID: ', docRef.id);
  document.querySelector('#message').value = '';
  document.getElementById('newMessage').dataset.id = docRef.id;
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = Timestamp.now();
  const myTimestamp = new Date(date.seconds * 1000).toLocaleString("hu-HU");
  return { message, username, date, myTimestamp, };
}

async function deleteMessage() {
  console.log(document.getElementById('newMessage').dataset.id);
  const docRef = doc(db, 'messages', this.parentElement.parentElement.dataset.id);
  await deleteDoc(docRef);
  console.log(docRef.id);
  console.log('Document deleted');
}

/**
 * downloads all messages from the database and displays them ordered by date
 */
async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const messages = await getDocs(q);
  document.querySelector('#messages').innerHTML = '';
  messages.forEach((doc) => {
    displayMessage(doc.data());
  });
}

function displayMessage(message) {
  console.log(document.getElementById('newMessage'));
  const messageHTML = /*html*/ `
    <div class="message" id="newMessage" data-id="${message.id}">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">${message.username}
          <time>${message.myTimestamp}</time>
        </span>
        <br>
        <span class="message-text">
          ${message.message}
        </span>
      </div>
      <div class="message-edit-buttons">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-pen"></i>
      </div>
    </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });
  document.querySelector(`[data-id="${message.id}"] .fa-trash-alt`).addEventListener('click', deleteMessage);
  //document.querySelector(`[data-id="${message.id}"] .fa-pen`).addEventListener('click', displayEditMessage);
}

function removeMessage(message) {
  document.querySelector(`[data-id="${message.id}"]`).remove();
}

function handleSubmit() {
  const message = createMessage();
  if (message.message && message.username)
    sendMessage(message);
  //displayMessage(message);
}

document.querySelector('#send').addEventListener('click', handleSubmit);

// send the message if the enter key is pressed
document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // the document is fully loaded
  displayAllMessages();
});

// document.querySelector('#messages').innerHTML = '';

let initialLoad = true;

const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('added');
      if (!initialLoad) {
        displayMessage(change.doc.data());
      }
    }
    if (change.type === 'modified') {
      console.log('Modified');
      //updateMessage(change.doc.data());
    }
    if (change.type === 'removed') {
      console.log('Removed');
      removeMessage(change.doc.data());
    }
  });
  initialLoad = false;
});