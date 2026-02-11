import { useState } from "react";
import { updateProfile } from "../api";
import { showSuccess, showError } from "../utils/toast";

function Profile() {
    const [name, setName] = useState(
        localStorage.getItem("user_name") || ""
    );
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = { name };

            // Secure password change
            if (newPassword) {
            payload.old_password = oldPassword;
            payload.new_password = newPassword;
            }

            const res = await updateProfile(payload);

            localStorage.setItem("user_name", res.data.name);
            window.dispatchEvent(new Event("user-name-updated"));


            showSuccess("Profile updated successfully");

            setOldPassword("");
            setNewPassword("");
        } catch (err) {
            showError(
            err?.response?.data?.detail || "Failed to update profile"
            );
        }
    };


  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
        <label className="block text-sm font-medium mb-1">
            Current Password
        </label>
        <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
        />
        </div>

        <div>
        <label className="block text-sm font-medium mb-1">
            New Password
        </label>
        <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Leave blank to keep current password"
        />
        </div>


        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default Profile;
