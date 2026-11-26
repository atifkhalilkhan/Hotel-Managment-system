import HomeHero from "./home/HomeHero";
import HomeRoomSearch from "./home/HomeRoomSearch";
import HomeIntro from "./home/HomeIntro";
import HomeRooms from "./home/HomeRooms";
import HomeAmenities from "./home/HomeAmenities";
import HomeExperience from "./home/HomeExperience";
import HomeServices from "./home/HomeServices";
import HomeReviews from "./home/HomeReviews";
import HomeGuestApp from "./home/HomeGuestApp";

// Home page: har section apni file mein (src/pages/home)
export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeRoomSearch />
      <HomeIntro />
      <HomeRooms />
      <HomeAmenities />
      <HomeExperience />
      <HomeServices />
      <HomeReviews />
      <HomeGuestApp />
    </>
  );
}
