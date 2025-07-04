import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeUserProfile } from "../../api/profile";
import "./NewUserForm.css";

const stepTitles = [
  "Tell us about yourself",
  "Add a profile picture",
  "Where are you located?",
  "Set your availability",
  "Choose your preferences",
  "Do you want your profile to be public?"
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["Morning", "Afternoon", "Evening"];

const preferenceCategories = {
  hobbies: ["Reading", "Gardening", "Cooking"],
  work: ["Programming", "Design", "Marketing"],
};

const NewUserForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    bio: "",
    identity: [],
    profile_picture: "",
    profile_preview_url: "",
    location: {
      city: "",
      state: "",
      country: "",
      zip: "",
    },
    availability: {},
    preference: {
      hobbies: [],
      work: [],
    },
    is_public: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value,
      },
    }));
  };

  const toggleIdentity = (role) => {
    setFormData((prev) => {
      const exists = prev.identity.includes(role);
      return {
        ...prev,
        identity: exists ? prev.identity.filter((r) => r !== role) : [...prev.identity, role],
      };
    });
  };

  const toggleAvailability = (day, time) => {
    setFormData((prev) => {
      const key = `${day}_${time}`;
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [key]: !prev.availability[key],
        },
      };
    });
  };

  const togglePreference = (category, item) => {
    setFormData((prev) => {
      const exists = prev.preference[category]?.includes(item);
      const updatedCategory = exists
        ? prev.preference[category].filter((p) => p !== item)
        : [...(prev.preference[category] || []), item];
  
      return {
        ...prev,
        preference: {
          ...prev.preference,
          [category]: updatedCategory,
        },
      };
    });
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepTitles.length - 1));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({ ...formData, profile_picture: undefined }));
      if (formData.profile_picture) {
        form.append("profile_picture", formData.profile_picture);
      }
  
      await completeUserProfile(form); 
      alert("✅ Profile submitted!");
      navigate("/home");
    } catch (err) {
      console.error("❌ Error submitting profile:", err);
      alert("Something went wrong.");
    }
  };  

  const handleSkip = async () => {
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({}));  
      await completeUserProfile(form);
      alert("⏭️ Skipped profile setup.");
      navigate("/home");
    } catch (err) {
      console.error("❌ Error skipping:", err);
      alert("Something went wrong.");
    }
  };
  

  return (
    <div className="new-user-form-container">
      <h2>{stepTitles[step]}</h2>

      <div className="step-content">
        {step === 0 && (
          <>
            <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
            <input name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
            <input name="bio" placeholder="Bio" value={formData.bio} onChange={handleChange} />
            <div className="identity-toggle">
              <label>Select your identity:</label>
              <div className="identity-buttons">
                {["pet_owner", "service_provider"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={formData.identity.includes(role) ? "active" : ""}
                    onClick={() => toggleIdentity(role)}
                  >
                    {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <label>Upload Profile Picture:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFormData((prev) => ({
                    ...prev,
                    profile_picture: file,
                    profile_preview_url: URL.createObjectURL(file) // store preview URL
                  }));
                }
              }}
            />

            {formData.profile_preview_url && (
              <div className="image-preview">
                <img
                  src={formData.profile_preview_url}
                  alt="Profile Preview"
                  style={{ width: "150px", height: "150px", borderRadius: "50%", marginTop: "1rem", objectFit: "cover", border: "1px solid #ccc" }}
                />
              </div>
            )}
          </>
        )}


        {step === 2 && (
          <>
            <input name="city" placeholder="City" value={formData.location.city} onChange={handleLocationChange} />
            <input name="state" placeholder="State" value={formData.location.state} onChange={handleLocationChange} />
            <input name="country" placeholder="Country" value={formData.location.country} onChange={handleLocationChange} />
            <input name="zip" placeholder="ZIP Code" value={formData.location.zip} onChange={handleLocationChange} />
          </>
        )}

        {step === 3 && (
          <>
            <p>Select your available time slots:</p>
            <div className="availability-grid">
              <div className="time-slot-header" />
              {daysOfWeek.map((day) => (
                <div key={`${day}-header`} className="day-header">{day}</div>
              ))}
              {timeSlots.map((slot) => (
                <React.Fragment key={slot}>
                  <div className="time-label">{slot}</div>
                  {daysOfWeek.map((day) => {
                    const key = `${day}_${slot}`;
                    return (
                      <div key={key} className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={formData.availability[key] || false}
                          onChange={() => toggleAvailability(day, slot)}
                        />
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p>Choose your preferences:</p>
            {Object.entries(preferenceCategories).map(([category, items]) => (
              <div key={category}>
                <h4>{category.toUpperCase()}</h4>
                <div className="preference-buttons">
                  {items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={formData.preference[category]?.includes(item) ? "active" : ""}
                      onClick={() => togglePreference(category, item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 5 && (
          <div className="toggle-public">
            <label>Make your profile public?</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="isPublicToggle"
                checked={formData.is_public}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, is_public: !prev.is_public }))
                }
              />
              <label htmlFor="isPublicToggle" className="switch-label" />
            </div>
          </div>
        )}
      </div>

      <div className="button-group">
        {step > 0 && <button onClick={handleBack}>Back</button>}
        {step < stepTitles.length - 1 ? (
          <button onClick={handleNext}>Next</button>
        ) : (
          <button onClick={handleSubmit}>Submit</button>
        )}
        <button className="skip" onClick={handleSkip}>Skip</button>
      </div>
    </div>
  );
};


export default NewUserForm;
