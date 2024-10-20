import express from "express";
import cors from "cors";
import connectDB from "./Config/DBConfig.js";
import User from "./Model/User.js";

class Node {
  constructor(type, left = null, right = null, value = null) {
    this.type = type;
    this.left = left;
    this.right = right;
    this.value = value;
  }
}

function toPostfix(tokens) {
  const precedence = {
    OR: 1,
    AND: 2,
  };

  const output = [];
  const operators = [];

  tokens.forEach((token) => {
    if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        output.push(operators.pop());
      }
      operators.pop();
    } else if (token in precedence) {
      while (
        operators.length &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        output.push(operators.pop());
      }
      operators.push(token);
    } else {
      output.push(token);
    }
  });

  while (operators.length) {
    output.push(operators.pop());
  }

  return output;
}

function buildAST(postfixTokens) {
  const stack = [];

  postfixTokens.forEach((token) => {
    if (token === "AND" || token === "OR") {
      const right = stack.pop();
      const left = stack.pop();
      const node = new Node("operator", left, right, token);
      stack.push(node);
    } else {
      stack.push(new Node("operand", null, null, token));
    }
  });

  return stack[0];
}

function tokenize(ruleString) {
  const tokens = ruleString.split(/\s+/);
  return tokens;
}

function evaluateAST(node, user) {
  if (node.type === "operand") {
    const conditionRegex = /([a-zA-Z]+)\s*(==|=|>|<)\s*(['"]?\w+['"]?)/;
    const matches = node.value.match(conditionRegex);

    if (!matches || matches.length !== 4) {
      throw new Error(`Invalid condition: ${node.value}`);
    }

    const [, attribute, operator, rawValue] = matches;
    let value = rawValue;

    if (value.startsWith("'") || value.startsWith('"')) {
      value = value.slice(1, -1);
    }

    switch (operator) {
      case ">":
        return user[attribute] > parseFloat(value);
      case "<":
        return user[attribute] < parseFloat(value);
      case "=":
      case "==":
        return user[attribute] == value;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  } else if (node.type === "operator") {
    const leftResult = evaluateAST(node.left, user);
    const rightResult = evaluateAST(node.right, user);

    if (node.value === "AND") {
      return leftResult && rightResult;
    } else if (node.value === "OR") {
      return leftResult || rightResult;
    }
  }

  return false;
}

const app = express();
app.use(cors());

connectDB();

app.listen(5000, () => {
  console.log("Server started at 5000");
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is get request from backend");
});

app.post("/api/eligibility", async (req, res) => {
  let { username, age, department, income, spend, rules } = req.body;

  try {
    username = username.replace(/\s+/g, "_");
    console.log(username);

    const tokens = tokenize(rules);
    const postfixTokens = toPostfix(tokens);
    console.log("Postfix Tokens:", postfixTokens);

    const ast = buildAST(postfixTokens);
    console.log("AST:", JSON.stringify(ast, null, 2));

    const user = { username, age, department, income, spend };

    const isEligible = evaluateAST(ast, user);

    if (isEligible) {
      const newUser = new User({
        username,
        age,
        department,
        income,
        spend,
        rules,
      });

      await newUser.save();
      return res.json({ message: "Eligible!" });
    }

    return res.json({ message: "Sorry ! Not Eligible" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Error evaluating rules: ${error.message}` });
  }
});
