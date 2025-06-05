const axios = require("axios")
const speakeasy = require("speakeasy")

class AngelBrokingService {
  constructor() {
    this.authToken = null
    this.feedToken = null
  }

  generateTOTP() {
    return speakeasy.totp({
      secret: process.env.TOTP_SECRET,
      encoding: "base32",
    })
  }

  async loginByPassword() {
    try {
      const currentTOTP = this.generateTOTP()

      const loginConfig = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
        data: {
          clientcode: process.env.CLIENT_CODE,
          password: process.env.MPIN,
          totp: currentTOTP,
        },
      }

      console.log("🔐 Attempting login with:")
      console.log("   Client Code:", process.env.CLIENT_CODE)
      console.log("   Password/MPIN:", process.env.MPIN)
      console.log("   TOTP:", currentTOTP)
      console.log("   API Key:", process.env.SMARTAPI_KEY)

      const response = await axios(loginConfig)

      console.log("📋 Full API Response:")
      console.log("   Status:", response.status)
      console.log("   Data:", JSON.stringify(response.data, null, 2))

      if (response.data && response.data.status === true) {
        this.authToken = response.data.data.jwtToken
        this.feedToken = response.data.data.feedToken
        console.log("✅ Successfully logged in to Angel Broking")
        console.log("📊 JWT Token:", this.authToken ? this.authToken.substring(0, 20) + "..." : "Not received")
        console.log("📊 Feed Token:", this.feedToken ? this.feedToken.substring(0, 10) + "..." : "Not received")
        return true
      } else {
        console.error("❌ Login failed:")
        console.error("   Status:", response.data?.status)
        console.error("   Message:", response.data?.message)
        console.error("   Error Code:", response.data?.errorcode)
        return false
      }
    } catch (error) {
      console.error("❌ Login error details:")
      console.error("   Error Type:", error.name)
      console.error("   Error Message:", error.message)

      if (error.response) {
        console.error("   HTTP Status:", error.response.status)
        console.error("   Response Data:", JSON.stringify(error.response.data, null, 2))
      }

      return false
    }
  }

  async loginByMPIN() {
    try {
      const currentTOTP = this.generateTOTP()

      const loginConfig = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByMPIN",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
        data: {
          clientcode: process.env.CLIENT_CODE,
          mpin: process.env.MPIN,
          totp: currentTOTP,
        },
      }

      console.log("🔐 Attempting alternative MPIN login with:")
      console.log("   Client Code:", process.env.CLIENT_CODE)
      console.log("   MPIN:", process.env.MPIN)
      console.log("   TOTP:", currentTOTP)

      const response = await axios(loginConfig)

      console.log("📋 Alternative API Response:")
      console.log("   Status:", response.status)
      console.log("   Data:", JSON.stringify(response.data, null, 2))

      if (response.data && response.data.status === true) {
        this.authToken = response.data.data.jwtToken
        this.feedToken = response.data.data.feedToken
        console.log("✅ Successfully logged in to Angel Broking (Alternative)")
        console.log("📊 JWT Token:", this.authToken ? this.authToken.substring(0, 20) + "..." : "Not received")
        console.log("📊 Feed Token:", this.feedToken ? this.feedToken.substring(0, 10) + "..." : "Not received")
        return true
      } else {
        console.error("❌ Alternative login failed:")
        console.error("   Status:", response.data?.status)
        console.error("   Message:", response.data?.message)
        console.error("   Error Code:", response.data?.errorcode)
        return false
      }
    } catch (error) {
      console.error("❌ Alternative login error:", error.response?.data || error.message)
      return false
    }
  }

  async login() {
    console.log("🔄 Trying primary login method...")
    let success = await this.loginByPassword()

    if (!success) {
      console.log("🔄 Primary login failed, trying alternative method...")
      success = await this.loginByMPIN()
    }

    return success
  }

  getAuthToken() {
    return this.authToken
  }

  getFeedToken() {
    return this.feedToken
  }

  isAuthenticated() {
    return !!this.authToken
  }
}

module.exports = new AngelBrokingService()
