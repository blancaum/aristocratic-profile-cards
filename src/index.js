const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
//const Database = require('better-sqlite3');
const CyclicDb = require('@cyclic.sh/dynamodb');

//const savedCards = [];

const server = express();

server.use(cors());
server.use(express.json({ limit: '25mb' }));
server.set('view engine', 'ejs');

//const db = new Database('./src/db/cards.db', { verbose: console.log });
const db = CyclicDb('fair-blue-dog-veilCyclicDB');

let savedCards = db.collection('savedCards');

const getCardById = async function (id) {
  // create an item in collection with key id
  // let cardId = await savedCards.set(id, result);

  // get an item at key id from collection
  let item = await savedCards.get(id);
  return item;
};

const insertCard = async function (id, cardData) {
  // create an item in collection with key id
  let card = await savedCards.set(id, cardData);
  return card;
};

//serverPort es igual al PORT (variable de entorno del sistema operativo) o si está vacío es igual a 4000
const serverPort = process.env.PORT || 4000;
server.listen(serverPort, () => {
  console.log(`Server listening at http://localhost:${serverPort}`);
});

// Escribimos los endpoints que queramos
server.post('/card', (req, res) => {
  //req.body esto es data en el servidor
  let success = true;
  const errorArray = [];
  for (const property in req.body) {
    if (req.body[property] === '') {
      success = false;
      errorArray.push(property);
    }
    console.log(req.body[property]);
  }

  if (success === true) {
    // const insertStmt = db.prepare(
    //   'INSERT INTO userCards (palette,name,email,photo,phone,linkedin,github,job,salary,openToWork,additionalInfo) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    // );
    // const result = insertStmt.run(
    //   req.body.palette,
    //   req.body.name,
    //   req.body.email,
    //   req.body.photo,
    //   req.body.phone,
    //   req.body.linkedin,
    //   req.body.github,
    //   req.body.job,
    //   req.body.salary,
    //   req.body.openToWork,
    //   req.body.additionalInfo
    // );

    const id = uuidv4();

    const cardData = {
      palette: req.body.palette,
      name: req.body.name,
      email: req.body.email,
      photo: req.body.photo,
      phone: req.body.phone,
      linkedin: req.body.linkedin,
      github: req.body.github,
      job: req.body.job,
      salary: req.body.salary,
      openToWork: req.body.openToWork,
      additionalInfo: req.body.additionalInfo,
    };

    insertCard(id, cardData);

    const responseSuccess = {
      success: true,
      //cambiamos la url de localhost a Cyclic.sh y le ponemos el ID
      cardURL: `https://fair-blue-dog-veil.cyclic.app/card/${id}`,
    };
    res.json(responseSuccess);
  } else {
    const responseFail = {
      success: false,
      error: `Error falta información ${errorArray.join()}`,
    };
    res.json(responseFail);
  }
});

server.get('/card/:id', (req, res) => {
  //guardamos el parámetro id de la url
  const id = req.params.id;
  //creamos la query
  //const query = db.prepare('SELECT * FROM userCards WHERE id = ?');
  //ejecuto la query y me devuelve los datos de la tarjeta que correspondan con el id de la url
  //const userCard = query.get(id);
  const userCard = getCardById(id);
  console.log(userCard);
  const salaryText = () => {
    if (userCard.salary === '1') {
      return '30.000-40.000';
    } else if (userCard.salary === '2') {
      return '40.000-50.000';
    } else {
      return '>=50.000';
    }
  };

  let openToWorkIcon = 'fa-lock-open';

  if (userCard.openToWork === 0) {
    openToWorkIcon = 'fa-lock';
  } else {
    openToWorkIcon = 'fa-lock-open';
  }

  // const openToWorkIcon =
  //   userCard.openToWork === '1' ? 'fa-lock-open' : 'fa-lock';

  const userCardFinal = {
    palette: userCard.palette,
    name: userCard.name,
    job: userCard.job,
    phone: userCard.phone,
    email: userCard.email,
    linkedin: userCard.linkedin,
    github: userCard.github,
    photo: userCard.photo,
    salary: salaryText(),
    openToWork: openToWorkIcon,
    additionalInfo: userCard.additionalInfo,
  };
  //pinto el template de tarjetas con mis datos personalizados (del id de la url)
  res.render('cardTemplate', userCardFinal);
});

const staticServer = './src/public-react';
server.use(express.static(staticServer));

const staticServerCSS = './src/public-css';
server.use(express.static(staticServerCSS));
