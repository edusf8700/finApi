const express = require("express");
const {v4: uuidv4} = require("uuid")

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF (req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if(!customer) {
    return res.status(400).json({ error: "Customer not exists" });
  } 

  req.customer = customer;

  return next();
};

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === "credit") {
      return acc + operation.amount;
    }else{
      return acc - operation.amount;
    }
  },0);

  return balance;
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    customer => customer.cpf === cpf
  );

  if(customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!"})
  };

  customers.push({
    uuid: uuidv4(),
    name,
    cpf,
    statement: []
  })

  return res.status(201).send();
});

app.use(verifyIfExistsAccountCPF);

app.get("/statement", (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post("/deposit", (req, res) => {
  const{ description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    type: "credit",
    createdAt: new Date()
  }

  customer.statement.push(statementOperation);

  return res.status(201).send();

});

app.post("/withdraw", (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (amount > balance) {
    return res.status(400).json({ error: "Insufficient funds!"})
  };

  const statementOperation = {
    amount,
    type: "debit",
    createdAt: new Date()
  }

  customer.statement.push(statementOperation);

  return res.status(201).send();

})

app.listen(3333);