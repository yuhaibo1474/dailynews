---
layout: digest
title: Horizon 日报
---

{% assign latest = site.posts | first %}

{% if latest %}
<p class="report-date"><time datetime="{{ latest.date | date: '%Y-%m-%d' }}">{{ latest.date | date: "%Y-%m-%d" }}</time></p>

{{ latest.content | markdownify }}
{% else %}
<p><em>暂无日报</em></p>
{% endif %}
