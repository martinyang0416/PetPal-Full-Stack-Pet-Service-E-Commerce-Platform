import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";
import { fetchProfile, completeUserProfile, getProfilePictureUrl } from "../../api/profile";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const slots = ["Morning", "Afternoon", "Evening"];

const EditProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: { city: "", state: "", country: "", zip: "" },
    profile_picture: null,
    identity: [],
    availability: {},
    pets: [],
    is_public: false,
    preference: { hobbies: [], work: [] }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || { city: "", state: "", country: "", zip: "" },
          profile_picture: null,
          identity: data.identity || [],
          availability: data.availability || {},
          pets: data.pets || [],
          is_public: data.is_public || false,
          preference: data.preference || { hobbies: [], work: [] }
        });
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const toggleIdentity = (role) => {
    setFormData((prev) => ({
      ...prev,
      identity: prev.identity.includes(role)
        ? prev.identity.filter((r) => r !== role)
        : [...prev.identity, role],
    }));
  };

  const toggleAvailability = (day, time) => {
    const key = `${day}_${time}`;
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key],
      },
    }));
  };

  const handlePreferenceChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      preference: {
        ...prev.preference,
        [type]: prev.preference[type].includes(value)
          ? prev.preference[type].filter((v) => v !== value)
          : [...prev.preference[type], value]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        identity: formData.identity,
        availability: formData.availability,
        pets: formData.pets,
        is_public: formData.is_public,
        preference: formData.preference
      }));
      if (formData.profile_picture) {
        form.append("profile_picture", formData.profile_picture);
      }

      await completeUserProfile(form);
      alert("Profile updated!");
      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Server error");
    }
  };

  if (loading) return <div>Loading...</div>;

  const isServiceProvider = formData.identity.includes("service_provider");

  return (
    <div className="edit-profile-container">
      <h2>Edit Your Profile</h2>
      <form className="edit-form" onSubmit={handleSubmit}>
        <label>Profile Picture:</label>
        <div className="profile-picture-preview" onClick={() => document.getElementById("profilePicInput").click()}>
        <img
            className="profile-img-circle"
            src={
              formData.profile_picture
                ? URL.createObjectURL(formData.profile_picture)
                : getProfilePictureUrl(profile.profile_picture)
            }
            alt="Profile Preview"
          />
        </div>
        <input
          id="profilePicInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => setFormData((prev) => ({ ...prev, profile_picture: e.target.files[0] }))}
        />

        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <label>Bio:</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />

        <label>Location:</label>
        <input placeholder="City" value={formData.location.city} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} />
        <input placeholder="State" value={formData.location.state} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} />
        <input placeholder="Country" value={formData.location.country} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })} />
        <input placeholder="ZIP" value={formData.location.zip} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, zip: e.target.value } })} />

        <label>Identity:</label>
        <div className="checkbox-group">
          <label><input type="checkbox" checked={formData.identity.includes("pet_owner")} onChange={() => toggleIdentity("pet_owner")} /> Pet Owner</label>
          <label><input type="checkbox" checked={formData.identity.includes("service_provider")} onChange={() => toggleIdentity("service_provider")} /> Service Provider</label>
        </div>

        {isServiceProvider && (
          <>
            <label>Availability:</label>
            <div className="availability-table-wrapper">
              <table className="availability-table">
                <thead><tr><th></th>{days.map((day) => (<th key={day}>{day}</th>))}</tr></thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot}>
                      <td><strong>{slot}</strong></td>
                      {days.map((day) => {
                        const key = `${day}_${slot}`;
                        return (
                          <td key={key}>
                            <input type="checkbox" checked={formData.availability[key] || false} onChange={() => toggleAvailability(day, slot)} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <label>Preferences:</label>

        <div className="preference-group">
          <strong>Hobbies:</strong>
          {["Reading", "Gardening", "Cooking"].map((hobby) => (
            <label key={hobby}>
              <input
                type="checkbox"
                checked={formData.preference.hobbies.includes(hobby)}
                onChange={() => handlePreferenceChange("hobbies", hobby)}
              />{" "}
              {hobby}
            </label>
          ))}
        </div>

        <div className="preference-group">
          <strong>Work:</strong>
          {["Programming", "Design", "Marketing"].map((work) => (
            <label key={work}>
              <input
                type="checkbox"
                checked={formData.preference.work.includes(work)}
                onChange={() => handlePreferenceChange("work", work)}
              />{" "}
              {work}
            </label>
          ))}
        </div>


        <label><input type="checkbox" checked={formData.is_public} onChange={() => setFormData((prev) => ({ ...prev, is_public: !prev.is_public }))} /> Make profile public</label>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProfile;
