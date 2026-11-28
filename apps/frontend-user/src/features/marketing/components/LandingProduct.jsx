import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Link2, ArrowUpRight, UsersRound, Send } from "lucide-react";

// Bounded illustrative sample matching RsvpGuestTable fields.
const sampleGuests = [
  { id: "demo-1", guestName: "ដារ៉ា និងគ្រួសារ", guestNameEn: "Dara & Family", channel: "Telegram", responseStatus: "ATTENDING", attendeeCount: 2 },
  { id: "demo-2", guestName: "ស្រីនិត", guestNameEn: "Sreynit", channel: "Web link", responseStatus: "PENDING", attendeeCount: 1 },
  { id: "demo-3", guestName: "វិសាល", guestNameEn: "Visal", channel: "Telegram", responseStatus: "DECLINED", attendeeCount: 2 },
];

export default function LandingProduct({ copy, lang }) {
  const [filter, setFilter] = useState("ALL");
  const statuses = {
    ATTENDING: copy("ចូលរួម", "Attending"),
    PENDING: copy("រង់ចាំ", "Pending"),
    DECLINED: copy("មិនចូលរួម", "Declined"),
  };
  const visibleGuests = sampleGuests.filter((guest) => filter === "ALL" || guest.responseStatus === filter);
  const confirmedSeats = sampleGuests.filter((g) => g.responseStatus === "ATTENDING").reduce((sum, g) => sum + g.attendeeCount, 0);

  return (
    <section className="kp-product kp-section" aria-labelledby="kp-product-title">
      <div className="kp-product-copy">
        <p className="kp-showcase-label">{copy("សម្រាប់ការរៀបចំថ្ងៃពិសេស", "Made for the whole celebration")}</p>
        <h2 id="kp-product-title">{copy("សន្លឹកការ និងភ្ញៀវ\nនៅកន្លែងតែមួយ។", "Your invitation.\nYour guests. Together.")}</h2>
        <p className="kp-section-lead">
          {copy(
            "រៀបចំព័ត៌មានពិធី ចែករំលែកតំណភ្ជាប់ និងតាមដានការឆ្លើយតបភ្ញៀវក្នុងគណនីរបស់អ្នក។",
            "Create your event details, share personalized guest links, and follow RSVP replies in one calm workspace."
          )}
        </p>
        <ul className="kp-product-points">
          <li>
            <Link2 size={20} aria-hidden="true" />
            <div>
              <strong>{copy("ការអញ្ជើញផ្ទាល់ខ្លួន", "A personal invitation")}</strong>
              <p>{copy("ព័ត៌មានគ្រួសារ កម្មវិធី និងទីតាំង សម្រាប់ភ្ញៀវរបស់អ្នក។", "Family details, celebration schedule, and map directions tailored for every guest.")}</p>
            </div>
          </li>
          <li>
            <Check size={20} aria-hidden="true" />
            <div>
              <strong>{copy("ដឹងថាអ្នកណានឹងចូលរួម", "Know who is coming")}</strong>
              <p>{copy("មើលចម្លើយ និងចំនួនអ្នកចូលរួម ដើម្បីត្រៀមទទួលភ្ញៀវ។", "Review responses, party sizes, and seating readiness without spreadsheets.")}</p>
            </div>
          </li>
        </ul>
        <Link to="/templates/browse" className="kp-text-link">
          {copy("ចាប់ផ្តើមបង្កើត", "Start creating")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="kp-guest-demo" role="group" aria-label={copy("គំរូការគ្រប់គ្រងចម្លើយភ្ញៀវ", "Guest response management demo")}>
        <div className="kp-guest-demo-bar">
          <span>
            <UsersRound size={18} aria-hidden="true" />
            {copy("បញ្ជីចម្លើយភ្ញៀវ", "Guest replies")}
          </span>
          <span className="kp-demo-label">{copy("គំរូបង្ហាញ", "Sample data")}</span>
        </div>

        <div className="kp-guest-demo-summary">
          <div>
            <span>{copy("ភ្ញៀវគំរូ", "Sample guests")}</span>
            <strong>{sampleGuests.length}</strong>
          </div>
          <div>
            <span>{copy("ចំនួនកៅអីបញ្ជាក់", "Confirmed seats")}</span>
            <strong>{confirmedSeats}</strong>
          </div>
          <div>
            <span>{copy("ការផ្ញើ", "Channels")}</span>
            <strong>Telegram · Web</strong>
          </div>
        </div>

        <div className="kp-guest-demo-content">
          <div className="kp-demo-filters" role="group" aria-label={copy("សាកមើលចម្លើយគំរូ", "Filter sample replies")}>
            {[
              ["ALL", copy("ទាំងអស់", "All replies")],
              ["ATTENDING", statuses.ATTENDING],
              ["PENDING", statuses.PENDING],
            ].map(([value, label]) => (
              <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>

          <table>
            <caption className="sr-only">{copy("ទិន្នន័យគំរូនៃចម្លើយភ្ញៀវ", "Illustrative guest response data")}</caption>
            <thead>
              <tr>
                <th scope="col">{copy("ភ្ញៀវ", "Guest")}</th>
                <th scope="col">{copy("ការផ្ញើ", "Delivery")}</th>
                <th scope="col">{copy("ស្ថានភាព", "Response")}</th>
                <th scope="col">{copy("ចំនួន", "Party")}</th>
              </tr>
            </thead>
            <tbody key={filter}>
              {visibleGuests.map((guest) => (
                <tr key={guest.id}>
                  <th scope="row">{lang === "en" ? guest.guestNameEn : guest.guestName}</th>
                  <td className="kp-demo-channel">
                    <Send size={12} aria-hidden="true" />
                    <span>{guest.channel}</span>
                  </td>
                  <td>
                    <span className={`kp-demo-status kp-demo-status--${guest.responseStatus.toLowerCase()}`}>
                      {statuses[guest.responseStatus]}
                    </span>
                  </td>
                  <td className="kp-demo-party">{guest.attendeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="kp-guest-demo-note">
          {copy("ឈ្មោះ និងចម្លើយខាងក្រោមជាទិន្នន័យគំរូសម្រាប់បង្ហាញប៉ុណ្ណោះ។ ភ្ញៀវឆ្លើយតបនៅលើសន្លឹកការដែលបានផ្សព្វផ្សាយ។", "Illustrative fixture: names and responses below are sample data. Guests respond on the published invitation.")}
        </p>
      </div>
    </section>
  );
}
