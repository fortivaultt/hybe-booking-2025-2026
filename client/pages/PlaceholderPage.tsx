import React from "react";
import Layout from "@/components/Layout";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
}) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-12 rounded-lg shadow-lg animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-lg text-gray-600">
            {subtitle || "This page is currently under construction. Please check back later."}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PlaceholderPage;
