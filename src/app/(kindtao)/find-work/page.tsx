import JobsCarousel from "./_components/JobsCarousel";
import React from "react";

export default function About() {
  const jobs = [
    {
      name: "Jarrel Steward",
      image: "/people/darrellSteward.png",
      location: "Cebu City",
      occupation: "Maid for Home",
      price: 550,
    },
    {
      name: "Ralph Edwards",
      image: "/people/ralphEdwards.png",
      location: "Cebu City",
      occupation: "Electrician",
      price: 550,
    },
    {
      name: "Esther Howard",
      image: "/people/estherHoward.png",
      location: "Talisay City",
      occupation: "Plumber",
      price: 550,
    },
    {
      name: "Theresa Webb",
      image: "/people/theresaWebb.png",
      location: "Talisay City",
      occupation: "Maid for Home",
      price: 550,
    },
    {
      name: "Devon Lane",
      image: "/people/devonLane.png",
      location: "Naga City",
      occupation: "Electrician",
      price: 550,
    },
    {
      name: "Kristin Watson",
      image: "/people/kristinWatson.png",
      location: "Naga City",
      occupation: "Plumber",
      price: 550,
    },
    {
      name: "Dianne Russell",
      image: "/people/dianneRussell.png",
      location: "Minglanilla",
      occupation: "Maid for Home",
      price: 550,
    },
    {
      name: "Jane Cooper",
      image: "/people/janeCooper.png",
      location: "Minglanilla",
      occupation: "Electrician",
      price: 550,
    },
  ];
  const locations = [
    "All",
    "Cebu City",
    "Talisay City",
    "Naga City",
    "Minglanilla",
  ];
  const jobTypes = ["All", "Maid for Home", "Developer", "Graphic Designer"];
  const payTypes = ["All", "Fixed"];

  return (
    <JobsCarousel
      jobs={jobs}
      locations={locations}
      jobTypes={jobTypes}
      payTypes={payTypes}
    />
  );
}
