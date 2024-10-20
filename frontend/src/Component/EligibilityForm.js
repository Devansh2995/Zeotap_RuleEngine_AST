import React, { useState } from "react";
import "./EligibilityForm.css";

function EligibilityForm() {
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    department: "",
    income: "",
    spend: "",
  });

  const [rules, setRules] = useState([
    { attribute: "age", operator: ">", value: "", logic: "AND" },
  ]);

  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [isEligible, setIsEligible] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedUsername = formData.username.replace(/\s+/g, "_");
    const ruleString = rules
      .map((rule, index) => {
        const logic = index === 0 ? "" : ` ${rule.logic} `;
        let value = rule.value;
        if (rule.attribute === "username") {
          value = value.replace(/\s+/g, "_");
        }
        return `${logic}${rule.attribute}${rule.operator}${value}`;
      })
      .join("");

    console.log("Eligibility Rules:", rules);
    console.log("Formatted Rule String:", ruleString);

    try {
      const response = await fetch("http://localhost:5000/api/eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          username: formattedUsername,
          rules: ruleString,
        }),
      });

      const result = await response.json();
      setEligibilityMessage(result.message);

      if(result.message.toLowerCase().includes("sorry")){
        setIsEligible(false);
      }else{
        setIsEligible(true);
      }

      setTimeout(() => {
        setEligibilityMessage("");
        setIsEligible(null);
      }, 1000);

      setFormData({
        username: "",
        age: "",
        department: "",
        income: "",
        spend: "",
      });

      setRules([
        { attribute: "age", operator: ">", value: "", logic: "AND" },
      ]);
    } catch (error) {
      console.error("Error submitting form:", error);
      setEligibilityMessage("Error checking eligibility");
      setIsEligible(false);

      setTimeout(() => {
        setEligibilityMessage("");
        setIsEligible(null);
      }, 2000);
    }
  };

  const addRule = () => {
    setRules([
      ...rules,
      { attribute: "age", operator: ">", value: "", logic: "AND" },
    ]);
  };

  const removeRule = (index) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="eligibility-form">
        <h3 className="form-header">User Data</h3>

        <input
          type="text"
          placeholder="Username"
          className="form-input"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Age"
          className="form-input"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
        />

        <input
          type="text"
          placeholder="Department"
          className="form-input"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Income"
          className="form-input"
          value={formData.income}
          onChange={(e) =>
            setFormData({ ...formData, income: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Spend"
          className="form-input"
          value={formData.spend}
          onChange={(e) => setFormData({ ...formData, spend: e.target.value })}
        />

        <h3 className="form-header">Eligibility Rules</h3>
        {rules.map((rule, index) => (
          <div key={index} className="rule-container">
            <select
              value={rule.attribute}
              className="rule-select"
              onChange={(e) =>
                handleRuleChange(index, "attribute", e.target.value)
              }
            >
              <option value="username">Name</option>
              <option value="age">Age</option>
              <option value="department">Department</option>
              <option value="income">Income</option>
              <option value="spend">Spend</option>
            </select>

            <select
              value={rule.operator}
              className="rule-select"
              onChange={(e) =>
                handleRuleChange(index, "operator", e.target.value)
              }
            >
              <option value=">">Greater than</option>
              <option value="<">Less than</option>
              <option value="=">Equal to</option>
            </select>

            <input
              type="text"
              placeholder="Value"
              className="rule-input"
              value={rule.value}
              onChange={(e) =>
                handleRuleChange(index, "value", e.target.value)
              }
            />

            {index > 0 && (
              <select
                value={rule.logic}
                className="rule-select"
                onChange={(e) =>
                  handleRuleChange(index, "logic", e.target.value)
                }
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}

            <button
              type="button"
              className="rule-remove-btn"
              onClick={() => removeRule(index)}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="rules-contain">
          <button type="button" className="add-rule-btn" onClick={addRule}>
            Add Rule
          </button>
          <button type="submit" className="submit-btn">
            Check Eligibility
          </button>
        </div>

        {eligibilityMessage && (
          <h2
            className={`eligibility-result ${
              isEligible ? "eligible" : "not-eligible"
            }`}
          >
            {eligibilityMessage}
          </h2>
        )}
      </form>
    </div>
  );
}

export default EligibilityForm;
