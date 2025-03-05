import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MemberManagement from "@/components/MemberManagement";
import { Loader2 } from "lucide-react";

const ThriftSystemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("thrift_systems")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setSystem(data);
      }
      setLoading(false);
    };

    if (id) {
      fetchSystemDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading system details: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{system.name}</h1>
      {/* Render other system details here */}
      <p className="mb-4">Contribution Amount: ₦{system.contribution_amount}</p>
      <p className="mb-4">Payout Schedule: {system.payout_schedule}</p>

      {/* Member Management Section */}
      <MemberManagement systemId={system.id} />
    </div>
  );
};

export default ThriftSystemDetails;
