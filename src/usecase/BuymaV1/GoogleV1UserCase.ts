import GoogleV1Dao from '@/daos/GoogleV1/GoogleV1Dao.scraping'

const googleV1Dao = new GoogleV1Dao()

class GoogleV1UseCase {
  public async Google() {
    return await googleV1Dao.GoogleScraping()
  }
}

export default GoogleV1UseCase
