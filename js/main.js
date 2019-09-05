const URL_REQUESTS = 'https://assets.playground.xyz/monofonik/0b758bb1_requests.json';
const URL_IMPRESSIONS = 'https://assets.playground.xyz/monofonik/6e727709_impressions.json';

window.onload = async function () {
  const impressionRateData = await ImpressionsManager.getData();
  TableRenderer.renderTableBody(impressionRateData);
};

/**
 * ImpressionsManager fetches data from 3rd party,
 * calculate the impressions rate,
 * filters and sorts data.
 */
const ImpressionsManager = {
  /**
   * Main function to get data ready to be used for rendering
   * This would be the only public function
   */
  getData: async () => {
    const rawImpressionData = await ImpressionsManager.fetchData();
    const rate = ImpressionsManager.getRate(rawImpressionData);
    const sortedRate = ImpressionsManager.sortRate(rate);

    return sortedRate;
  },

  /**
   * Fetched data from URLs and returns resolved promise
   */
  fetchData: async () => {
    const impressionPromise = fetch(URL_IMPRESSIONS);
    const requestPromise = fetch(URL_REQUESTS);

    return Promise.all([impressionPromise, requestPromise])
      .then(async response => {
        const impressionData = await response[0].json();
        const requestData = await response[1].json();

        return { impressionData, requestData };
      });
  },

  /**
   * Calculates rate and returns array of impressions with the rate < 90%
  */
  getRate: ({ impressionData, requestData }) => {
    const rateData = [];

    requestData.result.forEach(request => {
      const impression = impressionData.result.find(
        impressionItem => request['dimension.entity.placement'] === impressionItem['dimension.entity.placement']
      )

      if (impression !== undefined) {
        const rate = (100 / request.result) * impression.result

        if (rate < 90) {
          rateData.push({
            placementId: request['dimension.entity.placement'],
            rate: Math.round(rate * 100) / 100,
          });
        }
      }
    });

    return rateData;
  },

  /**
   * Sorts the array of impression objects based on rate
   */
  sortRate: (rateData) => {
    return rateData.sort(function (a, b) {
      return a.rate - b.rate;
    });
  }
}

/**
 * Renders rows of table with impressions data
 */
const TableRenderer = {
  renderTableBody: (impressionRateData) => {
    // not very precise selector, nor targetting ID, keeping it simple
    const table = document.querySelector("table tbody");

    impressionRateData.forEach(impression => {
      const row = table.insertRow();
      // used innerHTML here just to keep it simple one liner,
      // on prod would use textContent to prevent cross-site scripting attacks
      row.innerHTML = `<td>${impression.placementId}</td><td>${impression.rate} %</td>`;

      table.appendChild(row);
    });
  }
}
