import {
  RESET_TEST_STATUS,
  RESET_TEST_RESULT,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_LOAD_FAIL,
  COMPETITOR_RESULT_LOAD,
  SPEED_KIT_RESULT_LOAD,
  TERMINATE_TEST,
} from './types'
import { trackURL } from '../helper/utils'

export const resetTestStatus = () => ({
  type: RESET_TEST_STATUS
})

export const resetResult = () => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: RESET_TEST_RESULT })
  }
})

export const loadResult = (testId, isPlesk = false, mainMetric = null, useFactor = true) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let testOverview
    try {
      testOverview = await dispatch(getTestOverview(testId))
      const { competitorTestResult, speedKitTestResult } = testOverview
      const [ loadedCompetitorTestResult, loadedSpeedKitTestResult ] = await Promise.all([
        db.TestResult.load(competitorTestResult),
        db.TestResult.load(speedKitTestResult)
      ])

      if (testOverview.hasFinished && testOverview.factors) {
        if (getState().result.startTime) {
          const fmp = testOverview.factors.firstMeaningfulPaint
          trackURL('waitingTime', testOverview.url, { startTime: getState().result.startTime })
          trackURL('showTestResult', testOverview.url, { fmp })
          if (testOverview.factors.firstMeaningfulPaint >= 1.5) {
            trackURL('goodTestResult', testOverview.url, { fmp })
          }
        }
      } else {
        trackURL('errorTestResult', testOverview.url)
      }

      await updatePageViewCount(testId, db)

      dispatch({
        type: COMPETITOR_RESULT_LOAD,
        payload: loadedCompetitorTestResult
      })
      dispatch({
        type: SPEED_KIT_RESULT_LOAD,
        payload: loadedSpeedKitTestResult
      })
      dispatch({
        type: TERMINATE_TEST,
        payload: { isPlesk, mainMetric, useFactor }
      })
    } catch(e) {
      throw new Error("Test Result could not be loaded")
    }
    return testOverview
  }
})

/**
 * Loads a given testOverview from the baqend database.
 * @param testId The id of the test to be loaded.
 */
const getTestOverview = (testId) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let { testOverview } = getState().result
    if(Object.keys(testOverview).length === 0 || testOverview.id !== testId) {
      testOverview = await db.TestOverview.load(testId)
      if (testOverview) {
        dispatch({
          type: TESTOVERVIEW_LOAD,
          payload: testOverview
        })
        return testOverview.toJSON()
      } else {
        dispatch({
          type: TESTOVERVIEW_LOAD_FAIL,
          payload: null,
        })
        return null
      }
    }
    return testOverview
  }
})

const updatePageViewCount = async (testId, db) => {
  try {
    const wasReload = performance.navigation.type === performance.navigation.TYPE_RELOAD
    const wasInternal = document.referrer.indexOf('bbi.baqend') !== -1 ||
      document.referrer.indexOf('google.com') !== -1

    // Detect Page Reload - pageViews in database is not incremented in that case
    // Navigation from Loading Screen is treated as reload and therefore is not counted
    if (wasReload || wasInternal) {
      return
    }

    const testOverview = await db.TestOverview.load(testId)
    const metaData = testOverview.metaData || {}

    const pageViews = testOverview.metaData.pageViews || 0
    await testOverview.partialUpdate().set('metaData', Object.assign(metaData, { pageViews: pageViews + 1 })).execute()
  } catch (error) {
    // Ignore error
  }
}
