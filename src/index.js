const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const CyclicDb = require('@cyclic.sh/dynamodb');

const server = express();

server.use(cors());
server.use(express.json({ limit: '25mb' }));
server.set('view engine', 'ejs');

const db = CyclicDb('fair-blue-dog-veilCyclicDB');

let savedCards = db.collection('savedCards');

const renderCardById = async function (id, res) {
  // get an item at key id from collection
  let userCard = await savedCards.get(id);

  const salaryText = () => {
    if (userCard.props.salary === '1') {
      return '30.000-40.000';
    } else if (userCard.props.salary === '2') {
      return '40.000-50.000';
    } else {
      return '>=50.000';
    }
  };

  let openToWorkIcon = 'fa-lock-open';

  if (userCard.props.openToWork === 0) {
    openToWorkIcon = 'fa-lock';
  } else {
    openToWorkIcon = 'fa-lock-open';
  }

  const userCardFinal = {
    palette: userCard.props.palette,
    name: userCard.props.name,
    job: userCard.props.job,
    phone: userCard.props.phone,
    email: userCard.props.email,
    linkedin: userCard.props.linkedin,
    github: userCard.props.github,
    photo: userCard.props.photo,
    salary: salaryText(),
    openToWork: openToWorkIcon,
    additionalInfo: userCard.props.additionalInfo,
  };

  //pinto el template de tarjetas con mis datos personalizados (del id de la url)
  res.render('cardTemplate', userCardFinal);

  return userCardFinal;
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

  const userCard = renderCardById(id, res);
  console.log('User Card Final (JSON stringify): ' + JSON.stringify(userCard));
});

const staticServer = './src/public-react';
server.use(express.static(staticServer));

const staticServerCSS = './src/public-css';
server.use(express.static(staticServerCSS));
