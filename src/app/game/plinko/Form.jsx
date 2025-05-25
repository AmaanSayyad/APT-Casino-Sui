import React from "react";
import { Apple, Laptop, Tablet, Watch } from "lucide-react";
import DropdownButton from "../../../components/DropdownButton";
import CustomSelect from "@/components/CustomSelect";
import CustomInput from "../../../components/CustomInput";

const DynamicForm = ({ config, onSubmit }) => {
  // State to manage form values
  const [formData, setFormData] = React.useState(
    config.fields.reduce((acc, field) => {
      acc[field.id] = field.type === "multiSelect" ? [] : ""; // Initialize fields with appropriate default values
      return acc;
    }, {})
  );

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (name, selectedValues) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: selectedValues,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass the form data to the parent
  };

  return (
    <form onSubmit={handleSubmit} className="rounded shadow-md max-w-md">
      {config.fields.map((field) => (
        <div key={field.id} className="mb-4">
          {field.type === "singleSelect" && (
            <CustomSelect
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={handleChange}
              label={field.label}
              options={field.options}
            />
          )}

          {field.type === "text" && (
            <CustomInput
              type="text"
              label={field.label}
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
            />
          )}

          {field.type === "number" && (
            <CustomInput
              type="number"
              label={field.label}
              id={field.id}
              name={field.id}
              value={formData[field.id]}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        onClick={handleSubmit}
        className="w-full magic-gradient text-white py-2 px-4 rounded  cursor-pointer"
      >
        {config.submitButton || "Submit"}
      </button>
    </form>
  );
};

export default DynamicForm;
