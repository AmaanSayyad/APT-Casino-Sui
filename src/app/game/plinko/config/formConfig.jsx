export const manualFormConfig = {
  fields: [
    {
      id: "betAmount",
      label: "Bet Amount",
      type: "singleSelect",
      options: [10, 20, 50, 100, 200],
    },
    {
      id: "risks",
      label: "Risk",
      type: "singleSelect",
      options: ["Low", "Medium", "High"],
      placeholder: "Select Risk Level",
    },
    {
      id: "rows",
      label: "Numbers of Rows",
      type: "number",
      placeholder: "Enter No of Rows",
    },
  ],
  submitButton: "Bet",
};

export const autoFormConfig = {
  submitButton: "Bet",
  fields: [
    {
      id: "betAmount",
      label: "Bet Amount",
      type: "singleSelect",
      options: [10, 20, 50, 100, 200],
      placeholder: "Enter Bet Amount",
    },
    {
      id: "risks",
      label: "Risk",
      type: "singleSelect",
      options: ["Low", "Medium", "High"],
      placeholder: "Select Risk Level",
    },
    {
      id: "rows",
      label: "Numbers of Rows",
      type: "number",
      placeholder: "Enter No of Rows",
    },
    {
      id: "numberOfBets",
      label: "Numbers of Bet",
      type: "number",
      placeholder: "Enter No of Bets",
    },
  ],
};
