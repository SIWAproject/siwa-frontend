"use client";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Beta from "@/components/beta";


import React from 'react';
import Layout from "@/components/Layout";

const page = ({ params }: { params: { slug: string } }) => {
  const filterContent = ""; // Replace with the actual implementation of 'filterContent'
  
  return (
    <Layout slug={params.slug} filter={filterContent} >
      <div>
        {params.slug}
      </div>
    </Layout>
  );
};

export default page;