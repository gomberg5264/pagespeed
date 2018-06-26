import { baqend, model } from 'baqend'
import { AsyncFactory } from './_AsyncFactory'
import { ConfigCache } from './_ConfigCache'
import { ConfigGenerator } from './_ConfigGenerator'
import { getRootPath, getTLD } from './_getSpeedKitUrl'
import { DataType, Serializer } from './_Serializer'
import { setFailed, setQueued, Status } from './_Status'
import { TestBuilder } from './_TestBuilder'
import { TestFactory } from './_TestFactory'
import { TestParams } from './_TestParams'
import { generateUniqueId } from './generateUniqueId'

/**
 * Request which creates a TestOverview object and the TestResult objects that are processed
 * by the {@link ComparisonWorker} and the {@link TestWorker}.
 */
export class ComparisonFactory implements AsyncFactory<model.TestOverview> {
  constructor(
    private db: baqend,
    private testFactory: TestFactory,
    private testBuilder: TestBuilder,
    private configCache: ConfigCache,
    private configGenerator: ConfigGenerator,
    private serializer: Serializer,
  ) {
  }

  /**
   * Creates the object which is demanded by this factory.
   *
   * @return A promise which resolves with the created object.
   */
  async create(
    puppeteer: model.Puppeteer,
    params: TestParams,
    hasMultiComparison: boolean = false): Promise<model.TestOverview>
  {
    // Create the comparison object
    const comparison = await this.createComparison(puppeteer.url)

    // Update the comparison object with detailed information
    return this.updateComparison(comparison, puppeteer, params, hasMultiComparison)
  }

  /**
   * Create the comparison object itself.
   */
  async createComparison(url: string) {
    const uniqueId = await generateUniqueId(this.db, 'TestOverview')
    const tld = getTLD(url, this.db.log)
    const id = uniqueId + tld.split('.')[0]

    // Initialize
    const comparison = new this.db.TestOverview({ id })
    setQueued(comparison)

    return comparison.save()
  }

  async updateComparison(
    comparison: model.TestOverview,
    puppeteer: model.Puppeteer,
    params: TestParams,
    hasMultiComparison: boolean = false): Promise<model.TestOverview>
  {
    const config = await this.buildSpeedKitConfig(puppeteer, params)
    const requiredParams = this.testBuilder.buildSingleTestParams(params, config)
    const configAnalysis = puppeteer.speedKit ? this.createConfigAnalysis(puppeteer.url, puppeteer.speedKit) : null

    // Create the tests
    const [competitorTest, speedKitTest] = await Promise.all([
      this.createCompetitorTest(puppeteer, requiredParams),
      this.createSpeedKitTest(puppeteer, requiredParams),
    ])

    const { url, displayUrl, speedKit } = puppeteer
    comparison.configAnalysis = configAnalysis
    comparison.competitorTestResult = competitorTest
    comparison.speedKitTestResult = speedKitTest
    comparison.tasks = []

    // Copy Puppeteer info
    const speedKitVersion = speedKit !== null ? `${speedKit.major}.${speedKit.minor}.${speedKit.patch}` : null
    comparison.url = url
    comparison.displayUrl = displayUrl
    comparison.puppeteer = puppeteer
    comparison.isSpeedKitComparison = speedKit !== null
    comparison.speedKitVersion = speedKitVersion
    comparison.isSecured = url.startsWith('https://')
    comparison.type = puppeteer.type.framework
    comparison.psiDomains = puppeteer.stats.domains
    comparison.psiRequests = puppeteer.stats.requests
    comparison.psiResponseSize = puppeteer.stats.size.toString()
    if (puppeteer.screenshot) {
      comparison.psiScreenshot = puppeteer.screenshot
    }

    // Copy params
    comparison.caching = requiredParams.caching
    comparison.location = requiredParams.location
    comparison.mobile = requiredParams.mobile
    comparison.activityTimeout = requiredParams.activityTimeout
    comparison.speedKitConfig = requiredParams.speedKitConfig
    comparison.hasMultiComparison = hasMultiComparison

    return comparison.save()
  }

  async updateComparisonWithError(comparison: model.TestOverview): Promise<model.TestOverview> {
    // Create failed tests
    const [competitorTest, speedKitTest] = await Promise.all([
      this.createCompetitorTestWithError(),
      this.createSpeedKitTestWithError(),
    ])

    comparison.competitorTestResult = competitorTest
    comparison.speedKitTestResult = speedKitTest
    setFailed(comparison)

    return comparison.save()
  }

  /**
   * Builds the Speed Kit config to use for this test.
   */
  private async buildSpeedKitConfig(
    { url, speedKit, smartConfig }: model.Puppeteer,
    { mobile, speedKitConfig }: TestParams): Promise<string>
  {
    // Has the user set a config as a test parameter?
    if (speedKitConfig) {
      return speedKitConfig
    }

    // Is Speed Kit enabled on the URL? Get its config
    this.db.log.info(`${url} has Speed Kit: ${speedKit !== null ? 'yes' : 'no'}`)
    if (speedKit) {
      this.db.log.info(`Extracting config from URL: ${url}`)
      const { config } = speedKit
      const denormalize = this.serializer.denormalize(config)

      return this.serializer.serialize(denormalize, DataType.JAVASCRIPT)
    }

    // Take smart config from Puppeteer
    if (smartConfig) {
      const data = this.serializer.deserialize(smartConfig, DataType.JSON)

      return this.serializer.serialize(data, DataType.JAVASCRIPT)
    }

    throw new Error(`Config is missing for ${url}`)
  }

  /**
   * Creates a config analysis of the given URL.
   */
  private createConfigAnalysis(url: string, { config, swUrl }: model.PuppeteerSpeedKit): model.ConfigAnalysis {
    const configAnalysis: model.ConfigAnalysis = new this.db.ConfigAnalysis()
    configAnalysis.swPath = swUrl

    if (!config) {
      configAnalysis.configMissing = true
      return configAnalysis
    }

    const rootPath = getRootPath(this.db, url)

    configAnalysis.configMissing = false
    configAnalysis.swPathMatches = config.sw || rootPath + '/sw.js' === swUrl
    configAnalysis.isDisabled = config.disabled === true

    return configAnalysis
  }

  /**
   * Creates a competitor test from params.
   */
  private createCompetitorTest(puppeteer: model.Puppeteer, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(false, puppeteer, params)
  }

  /**
   * Creates a Speed Kit test from params.
   */
  private createSpeedKitTest(puppeteer: model.Puppeteer, params: Required<TestParams>): Promise<model.TestResult> {
    return this.createTest(true, puppeteer, params)
  }

  /**
   * Creates a test from params.
   */
  private createTest(isClone: boolean, puppeteer: model.Puppeteer, params: Required<TestParams>) {
    return this.testFactory.create(puppeteer, isClone, params)
  }

  /**
   * Creates a failed competitor test.
   */
  private createCompetitorTestWithError(): Promise<model.TestResult> {
    return this.createTestWithError(false)
  }

  /**
   * Creates a failed Speed Kit test.
   */
  private createSpeedKitTestWithError(): Promise<model.TestResult> {
    return this.createTestWithError(true)
  }

  /**
   * Creates a failed test.
   */
  private createTestWithError(isClone: boolean) {
    return this.testFactory.createWithError(isClone)
  }
}
