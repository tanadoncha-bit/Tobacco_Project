"use client";

import React, { useState } from "react";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type EmployeeFormValues = {
  firstname: string;
  lastname: string;
  email: string;
  tel: string;
  address: string;
  gender: Gender;
  dateOfBirth: string; // yyyy-mm-dd
  ssn: string;
  position: string;
  salary: string; // เก็บเป็น string ในฟอร์ม แล้ว parse ตอนส่ง
};

const initialValues: EmployeeFormValues = {
  firstname: "",
  lastname: "",
  email: "",
  tel: "",
  address: "",
  gender: "MALE",
  dateOfBirth: "",
  ssn: "",
  position: "",
  salary: "",
};

type Props = {
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
};

export default function EmployeeForm({ onSubmit, submitting, error }: Props) {
  const [values, setValues] = useState<EmployeeFormValues>(initialValues);
  const inputClass =
    "w-full rounded-lg border border-gray-300 p-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none";
  const labelClass = "flex flex-col gap-1 text-sm font-medium";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void onSubmit(values);
      }}
      className="space-y-4 text-indigo-900"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
        <label className={labelClass}>
          First Name
          <input
            name="firstname"
            placeholder="First name"
            value={values.firstname}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>

        <label className={labelClass}>
          Last Name
          <input
            name="lastname"
            placeholder="Last name"
            value={values.lastname}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Email
        <input
          name="email"
          placeholder="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Phone
          <input
            name="tel"
            placeholder="Phone"
            value={values.tel}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>

        <label className={labelClass}>
          Gender
          <select
            name="gender"
            value={values.gender}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Address
        <input
          name="address"
          placeholder="Address"
          value={values.address}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Date of Birth
          <input
            name="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>

        <label className={labelClass}>
          National ID Number
          <input
            name="ssn"
            placeholder="SSN"
            value={values.ssn}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Position
          <input
            name="position"
            placeholder="Position"
            value={values.position}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>

        <label className={labelClass}>
          Salary
          <input
            name="salary"
            placeholder="Salary"
            type="number"
            min={0}
            step="100"
            value={values.salary}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!!submitting}
          className="rounded-lg bg-indigo-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Add employee"}
        </button>
      </div>
    </form>
  );
}
