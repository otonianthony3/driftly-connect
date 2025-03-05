import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ThriftSystemSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    // Implement your search logic here.
    console.log("Searching for:", searchTerm);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search Thrift Systems</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      {/* Render search results here */}
    </div>
  );
};

export default ThriftSystemSearch;
