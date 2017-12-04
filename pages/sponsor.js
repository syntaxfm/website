import React from 'react';
import axios from 'axios';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Meta from '../components/meta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Page from '../components/Page';

export default class SponsorPage extends React.Component {
  componentDidCatch = e => {
    console.log('ERRORRRRR');
    console.log(e);
  };
  render() {
    return (
      <Page>
        <div className="wrapper wrapper--text">
          <h1>Syntax Sponsorship</h1>
          <p>
            Interested in getting your message to thousands of developers? We're interested in helping! If you think our
            audience is a good fit for your, let's chat about how we can make this sponsorship worth it for you.
          </p>
          <figure style={{ float: 'left', marginRight: 35 }}>
            <img
              src="https://scontent-cdt1-1.cdninstagram.com/t51.2885-15/e35/21296117_363593310764072_4619537012486045696_n.jpg"
              width="400"
            />
            <figcaption>
              Photo by <a href="https://www.instagram.com/dhanishgajjar/">Dhanish Gajjar</a>
            </figcaption>
          </figure>
          <p>
            Syntax is a fun — and sometimes funny — Podcast for Web Developers hosted by{' '}
            <a href="https://wesbos.com">Wes Bos</a> and <a href="http://scotttolinski.com/">Scott Tolinkski</a>, two
            independent full stack developers who create online training courses. Each episode Scott and Wes break down topics to provide <em>"Tasty Treats"</em> to the audience — applicable tips and nuggets of information to help Web Developers in their careers.
          </p>
          <p>
            Sponsoring the Syntax podcast is ideal for anyone looking to reach a engaged, technical, high income
            audience. This may include:
          </p>
          <ul>
            <li>Developer Tooling, Software and Services</li>
            <li>Developer teams looking to hire</li>
            <li>Technical Training Material</li>
            <li>Technical Hardware Products</li>
            <li>
              Premium lifestyle products targeted towards high income individuals such as t-shirts, underwear or
              backpacks
            </li>
          </ul>
          <h2>Audience Size && Breakdown</h2>
          <p>Each Sponsorship spot will receive an average of 28,000 downloads. Each spot will receive at least 23,000 downloads and some of the shows reach 40-50,000 after a few months of listening.</p>

          <p>While exact numbers are hard to get, we can tell you this about our audience</p>
          <ul>
            <li>Syntax has been in the Overcast <strong>top 20</strong> Technology podcasts since launch</li>
            <li>
              The geographic makeup of the audience 44% USA, 8% Canada, 8% Unitedy Kingdom, 4% Germany, 4% Australia, 2%
              Sweden, 2% Netherlands.
            </li>
            <li>The rest of the audience is fairly well distributed between the rest of Europe, Brazil and India.</li>
            <li>Of those who listen in the browser, 80% use Chrome, 13% Safari and 7% Firefox</li>
            <li>Of those who listen on phones, it's about 80% iPhone and 20% Android</li>
            <li>
              According to Twitter's Analytic tools, 48% of Wes' U.S. audience has an income of $75,000 or greater.
            </li>
            <li>51% are aged 18 to 24 and 22% 25 to 34</li>
            <li>The top "lifestyle type" is Online Buyers</li>
          </ul>

          <figure style={{ float: 'right', marginLeft: 20 }}>
            <img src="https://instagram.fybz1-1.fna.fbcdn.net/t51.2885-15/e35/22157944_396029214150820_7452835776976388096_n.jpg" width="400" alt="iPhone showing a Syntax Episode" />
            <figcaption>
              Photo by <a href="https://www.instagram.com/dhanishgajjar/">Dhanish Gajjar</a>
            </figcaption>
          </figure>

          <h2>Audience Interests</h2>
          <p>
            The Syntax audience is primarily developers, about half the shows focus on hard technocal skills while the other half is focused on soft skills or topics tangentaly related to web development.
          </p>

          <p>The audience's technical interests include:</p>

          <ul>
            <li>CSS Libraries, Frameworks</li>
            <li>JavaScript Frameworks such as React, Angular and Vue</li>
            <li>JavaScript Utility Libraries</li>
            <li>Server Side JavaScript</li>
            <li>WordPress and Laravel</li>
            <li>Software Design Patterns and Methodologies</li>
         </ul>

          <p>On the Soft Skills side, the audience has an appetite for the following topics:</p>
          <ul>
            <li>Self improvement & productivity</li>
            <li>Freelancing and running small businesses</li>
            <li>Marketing & Passive Income</li>
            <li>Work / Life Balance</li>
            <li>Fitness and Nutrition</li>
            <li>Premium Products — Scott and Wes weekly have a "Sick Pick", which is a product or service that they have been enjoying lately.</li>
          </ul>

          <h2>What You'll Get && Pricing</h2>
          <p>
            Currently each Sponsor spot is $800 USD per episode, though this price will increase as our audience reach does. If you are booking 3 or more episodes, we will offer you a discount on the sponsorship package.
          </p>

          <p>As part of the sponsorship package, you'll get:</p>

          <ol>
            <li>A sponsorship section at the top of the episode show notes. These notes are listed on both the Syntax.fm website as well as on each user's mobile device when they listen to the podcast. This is a great opportunity to list any coupon codes or unique links you'd like listeners to click on.</li>
            <li>A mention and single line at the top of the show. For Example, Wes might say <em>This episode is sponsored by Freshbooks — They are my favourite cloud accounting software and we will talk about why part way through the show.</em></li>
            <li>A 1-2 min sponsor spot part way through the show. While we can do a regular ad read, we have found that having Scott or Wes talk about the product or service and their experience with it works really well.</li>
            <li>A thank-you tweet from <a href="">@SyntaxFM</a> with a link to your product or service from the show's twitter account.</li>
          </ol>


          <h2>Case Study: DevLifts</h2>
          <p><a href="https://devlifts.io/">Dev Lifts</a> is fitness company that creates personal training and nutrition plans for their customers. </p>

          <p>As part of their company launch, Dev Lifts sponsored Syntax for a single episode, offering a $50 off coupon to Syntax listeners.</p>

          <p>Within 10 days of sponsoring the episode, Dev Lifts had generated over $9,500 USD in revenue that was directly tied to Syntax listeners, getting more than 10× return on their sponsorship investment.</p>

          <p>DevLifts is now a sponsoring multiple episodes and will be using Syntax as an ongoing revenue and leads source.</p>
        </div>
      </Page>
    );
  }
}
